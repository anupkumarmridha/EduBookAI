import { Router } from 'express';
import passport from 'passport';
import { body, ValidationChain } from 'express-validator';
import asyncHandler from 'express-async-handler';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller';
import { validateRequest, requireAuth } from '../middleware/auth.middleware';

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later'
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per window
  message: 'Too many signup attempts, please try again later'
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per window
  message: 'Too many password reset attempts, please try again later'
});

const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many refresh attempts, please try again later'
});

const router = Router();

// Validation middleware
const signupValidation: ValidationChain[] = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
];

const loginValidation: ValidationChain[] = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const passwordValidation: ValidationChain[] = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
];

// Auth routes
router.post('/signup',
  signupLimiter,
  signupValidation,
  validateRequest,
  asyncHandler(authController.signup.bind(authController))
);

router.post('/login',
  loginLimiter,
  loginValidation,
  validateRequest,
  asyncHandler(authController.login.bind(authController))
);

router.post('/refresh-token',
  refreshTokenLimiter,
  asyncHandler(authController.refreshToken.bind(authController))
);

router.get('/profile',
  requireAuth,
  asyncHandler(authController.getProfile.bind(authController))
);

// Email verification
router.get('/verify-email/:token',
  asyncHandler(authController.verifyEmail.bind(authController))
);

// Password reset
router.post('/forgot-password',
  forgotPasswordLimiter,
  body('email').isEmail().withMessage('Please enter a valid email'),
  validateRequest,
  asyncHandler(authController.forgotPassword.bind(authController))
);

router.post('/reset-password/:token',
  passwordValidation,
  validateRequest,
  asyncHandler(authController.resetPassword.bind(authController))
);

// OAuth routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/login'
  }),
  asyncHandler(authController.googleCallback.bind(authController))
);

export { router as authRouter };
