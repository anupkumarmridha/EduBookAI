import mongoose, { Schema, Document } from 'mongoose';

export interface IEBook extends Document {
  title: string;
  author: string;
  description?: string;
  category: mongoose.Types.ObjectId;
  format: 'PDF' | 'EPUB' | 'HTML';
  filePath: string;
  fileSize: number;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  lastModifiedAt: Date;
  metadata: {
    isbn?: string;
    publisher?: string;
    publicationYear?: number;
    language?: string;
    tags?: string[];
  };
}

const eBookSchema = new Schema<IEBook>({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  format: { 
    type: String, 
    required: true,
    enum: ['PDF', 'EPUB', 'HTML']
  },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  lastModifiedAt: { type: Date, default: Date.now },
  metadata: {
    isbn: { type: String },
    publisher: { type: String },
    publicationYear: { type: Number },
    language: { type: String },
    tags: [{ type: String }]
  }
}, {
  timestamps: true
});

// Create indexes for common queries
eBookSchema.index({ title: 'text', author: 'text' });
eBookSchema.index({ category: 1 });
eBookSchema.index({ format: 1 });
eBookSchema.index({ 'metadata.tags': 1 });

export const EBook = mongoose.model<IEBook>('EBook', eBookSchema);
