import { Router } from 'express';
import { body, ValidationChain } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { User } from '../models/user.model';
import { validateRequest, requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Validation middleware for updating role
const roleValidation: ValidationChain[] = [
  body('role')
    .isIn(['user', 'admin'])
    .withMessage('Invalid role')
];

// Get all users
router.get('/users',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
  })
);

// Update user role
router.patch('/users/:userId/role',
  requireAuth,
  requireAdmin,
  roleValidation,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body as { role: 'user' | 'admin' };

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Prevent self-demotion: cast req.user to any to access _id.
    if ((req.user as any)?._id?.toString() === userId) {
      res.status(403).json({ message: 'Cannot modify own role' });
      return;
    }

    user.role = role;
    await user.save();

    res.json(user);
  })
);

export { router as adminRouter };