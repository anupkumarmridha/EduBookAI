import nodemailer from 'nodemailer';
import { IUser } from '../models/user.model';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  FRONTEND_URL
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: true,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

export class EmailService {
  static async sendVerificationEmail(user: IUser, token: string): Promise<void> {
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
      from: SMTP_USER,
      to: user.email,
      subject: 'Verify your email address',
      html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, please ignore this email.</p>
      `
    });
  }

  static async sendPasswordResetEmail(user: IUser, token: string): Promise<void> {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: SMTP_USER,
      to: user.email,
      subject: 'Reset your password',
      html: `
        <h1>Password Reset</h1>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      `
    });
  }

  static async sendPasswordChangeNotification(user: IUser): Promise<void> {
    await transporter.sendMail({
      from: SMTP_USER,
      to: user.email,
      subject: 'Your password has been changed',
      html: `
        <h1>Password Changed</h1>
        <p>Your password has been successfully changed.</p>
        <p>If you did not make this change, please contact support immediately.</p>
      `
    });
  }
}
