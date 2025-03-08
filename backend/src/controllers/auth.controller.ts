import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/user.model';
import { EmailService } from '../services/email.service';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { JWT_SECRET, JWT_EXPIRES_IN = '24h', JWT_REFRESH_EXPIRES_IN = '7d' } = process.env;

if (!JWT_SECRET) {
  throw new Error('JWT configuration is missing');
}

interface JwtPayload {
  id: string;
  type: 'access' | 'refresh';
}

class AuthController {
  private generateTokens(userId: string): { accessToken: string; refreshToken: string } {
    if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
    
    const accessPayload: JwtPayload = { id: userId, type: 'access' };
    const refreshPayload: JwtPayload = { id: userId, type: 'refresh' };
    
    const accessToken = jwt.sign(
      accessPayload,
      JWT_SECRET as jwt.Secret,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );
    
    const refreshToken = jwt.sign(
      refreshPayload,
      JWT_SECRET as jwt.Secret,
      { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
  }
    
  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async signup(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ message: 'Email already registered' });
        return;
      }

      const verificationToken = this.generateVerificationToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const user = await User.create({
        email,
        password,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      });

      await EmailService.sendVerificationEmail(user, verificationToken);

      const { accessToken, refreshToken } = this.generateTokens(user._id.toString());

      res.status(201).json({
        message: 'Signup successful. Please check your email to verify your account.',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error creating user' });
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        res.status(400).json({ message: 'Invalid or expired verification token' });
        return;
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error verifying email' });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const resetToken = this.generateVerificationToken();
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      await EmailService.sendPasswordResetEmail(user, resetToken);

      res.json({ message: 'Password reset email sent' });
    } catch (error) {
      res.status(500).json({ message: 'Error processing request' });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        res.status(400).json({ message: 'Invalid or expired reset token' });
        return;
      }

      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      await EmailService.sendPasswordChangeNotification(user);

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      res.status(500).json({ message: 'Error resetting password' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user || !user.password) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      const { accessToken, refreshToken } = this.generateTokens(user._id.toString());

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error logging in' });
    }
  }

  async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
      if (!user) {
        res.status(401).json({ message: 'Authentication failed' });
        return;
      }

      const { accessToken, refreshToken } = this.generateTokens(user._id.toString());

      res.redirect(
        `${process.env.FRONTEND_URL}/oauth/callback?` +
        `accessToken=${accessToken}&` +
        `refreshToken=${refreshToken}`
      );
    } catch (error) {
      res.status(500).json({ message: 'Error processing OAuth callback' });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ message: 'Refresh token is required' });
        return;
      }

      const decoded = jwt.verify(refreshToken, JWT_SECRET as jwt.Secret) as JwtPayload;
      
      if (decoded.type !== 'refresh') {
        res.status(401).json({ message: 'Invalid token type' });
        return;
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const tokens = this.generateTokens(user._id.toString());

      res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ message: 'Refresh token expired' });
      } else {
        res.status(401).json({ message: 'Invalid refresh token' });
      }
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
      if (!user?._id) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const userProfile = await User.findById(user._id).select('-password');
      if (!userProfile) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({ user: userProfile });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching profile' });
    }
  }
}

export const authController = new AuthController();
