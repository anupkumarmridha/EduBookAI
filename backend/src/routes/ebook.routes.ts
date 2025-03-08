import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
  createCategory,
  getCategories,
  uploadEBook,
  getEBooks,
  updateEBook,
  deleteEBook
} from '../controllers/ebook.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads/ebooks');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFileName);
  }
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/epub+zip',
    'text/html'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, EPUB, and HTML files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Category routes
router.post('/categories', requireAuth, requireAdmin, createCategory);
router.get('/categories', requireAuth, getCategories);

// eBook routes
router.post('/upload', requireAuth, requireAdmin, upload.single('file'), uploadEBook);
router.get('/', requireAuth, getEBooks);
router.put('/:id', requireAuth, requireAdmin, updateEBook);
router.delete('/:id', requireAuth, requireAdmin, deleteEBook);

export default router;
