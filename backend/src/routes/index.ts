import express from 'express';
import { authRouter } from './auth.routes';
import { adminRouter } from './admin.routes';
import ebookRouter from './ebook.routes';
import { requireAuth } from '../middleware/auth.middleware';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const ebooksDir = path.join(uploadsDir, 'ebooks');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(ebooksDir)) {
  fs.mkdirSync(ebooksDir);
}

// Serve uploaded files
router.use('/uploads', requireAuth, express.static(uploadsDir));

// API routes
router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/ebooks', ebookRouter);

export default router;
