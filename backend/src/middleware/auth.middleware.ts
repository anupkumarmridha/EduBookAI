import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/user.model';

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured');
}

interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

// Extend Request to include a 'user' property.
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

export const requireAuth = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // We're casting req to AuthenticatedRequest before assigning user.
  const authReq = req as AuthenticatedRequest;
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

  const user = await User.findById(payload.id);
  if (!user) {
    res.status(401).json({ message: 'User not found' });
    return;
  }

  // Convert the Mongoose document to a plain object.
  authReq.user = user.toObject() as IUser;
  next();
});

export const requireAdmin = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (authReq.user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  next();
});

export const requireEmailVerified = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (!authReq.user.isEmailVerified) {
    res.status(403).json({ message: 'Email verification required' });
    return;
  }

  next();
});