import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  parentCategory?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
  name: { 
    type: String, 
    required: true,
    unique: true 
  },
  description: { type: String },
  parentCategory: { 
    type: Schema.Types.ObjectId, 
    ref: 'Category',
    default: null
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
}, {
  timestamps: true
});

// Create indexes for common queries
categorySchema.index({ name: 'text' });
categorySchema.index({ parentCategory: 1 });

// Add a pre-save hook to ensure unique names within the same parent category
categorySchema.pre('save', async function(this: ICategory, next) {
  const Category = this.constructor as mongoose.Model<ICategory>;
  const existingCategory = await Category.findOne({
    name: this.name,
    parentCategory: this.parentCategory || null,
    _id: { $ne: this._id }
  });

  if (existingCategory) {
    next(new Error('Category name must be unique within the same parent category'));
  }
  next();
});

export const Category = mongoose.model<ICategory>('Category', categorySchema);
