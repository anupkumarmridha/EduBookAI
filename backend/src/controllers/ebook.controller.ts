import { Request, Response } from 'express';
import { EBook } from '../models/ebook.model';
import { Category } from '../models/category.model';
import { asyncHandler } from '../utils/asyncHandler';
import mongoose from 'mongoose';

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, parentCategory } = req.body;

  const category = await Category.create({
    name,
    description,
    parentCategory: parentCategory || null,
    createdBy: req.user?._id
  });

  res.status(201).json({
    success: true,
    data: category
  });
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await Category.find()
    .populate('parentCategory', 'name')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: categories
  });
});

export const uploadEBook = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new Error('Please upload a file');
  }

  const {
    title,
    author,
    description,
    category,
    format,
    metadata
  } = req.body;

  // Validate format
  if (!['PDF', 'EPUB', 'HTML'].includes(format)) {
    throw new Error('Invalid file format');
  }

  // Validate category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new Error('Category not found');
  }

  const ebook = await EBook.create({
    title,
    author,
    description,
    category,
    format,
    filePath: req.file.path,
    fileSize: req.file.size,
    uploadedBy: req.user?._id,
    metadata: JSON.parse(metadata || '{}')
  });

  res.status(201).json({
    success: true,
    data: ebook
  });
});

export const getEBooks = asyncHandler(async (req: Request, res: Response) => {
  const { category, format, search } = req.query;

  const query: any = {};

  if (category) {
    query.category = new mongoose.Types.ObjectId(category as string);
  }

  if (format) {
    query.format = format;
  }

  if (search) {
    query.$text = { $search: search as string };
  }

  const ebooks = await EBook.find(query)
    .populate('category', 'name')
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: ebooks
  });
});

export const updateEBook = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove fields that shouldn't be updated directly
  delete updateData.filePath;
  delete updateData.fileSize;
  delete updateData.uploadedBy;

  const ebook = await EBook.findByIdAndUpdate(
    id,
    { 
      ...updateData,
      lastModifiedAt: new Date()
    },
    { new: true }
  )
    .populate('category', 'name')
    .populate('uploadedBy', 'name email');

  if (!ebook) {
    throw new Error('EBook not found');
  }

  res.status(200).json({
    success: true,
    data: ebook
  });
});

export const deleteEBook = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const ebook = await EBook.findByIdAndDelete(id);

  if (!ebook) {
    throw new Error('EBook not found');
  }

  // Here you would also delete the actual file from storage
  // Implementation depends on your file storage solution

  res.status(200).json({
    success: true,
    data: {}
  });
});
