import React, { useState, useEffect } from 'react';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../utils/apiClient';

interface Category {
  _id: string;
  name: string;
  description?: string;
  parentCategory?: {
    _id: string;
    name: string;
  };
}

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/api/ebooks/categories');
      setCategories((response as { data: { data: Category[] } }).data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      showToast.error('Failed to fetch categories');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast.error('Category name is required');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/ebooks/categories', {
        name,
        description: description.trim() || undefined,
        parentCategory: parentCategory || undefined
      });
      showToast.success('Category created successfully');
      setName('');
      setDescription('');
      setParentCategory('');
      fetchCategories();
    } catch (error) {
      console.error('Failed to create category:', error);
      showToast.error('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Category Management</h2>
      
      <form onSubmit={handleSubmit} className="mb-8 space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-1">
            Category Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Parent Category
          </label>
          <select
            value={parentCategory}
            onChange={(e) => setParentCategory(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">None</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Creating...' : 'Create Category'}
        </button>
      </form>

      <div>
        <h3 className="text-xl font-semibold mb-4">Existing Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category._id}
              className="p-3 border rounded bg-white shadow-sm"
            >
              <div className="font-medium">{category.name}</div>
              {category.description && (
                <div className="text-gray-600 text-sm mt-1">
                  {category.description}
                </div>
              )}
              {category.parentCategory && (
                <div className="text-sm text-gray-500 mt-1">
                  Parent: {category.parentCategory.name}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
