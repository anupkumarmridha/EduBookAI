import React, { useState, useEffect } from 'react';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../utils/apiClient';

interface Category {
  _id: string;
  name: string;
}

export const EBookUploader: React.FC = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [format, setFormat] = useState<'PDF' | 'EPUB' | 'HTML'>('PDF');
  const [file, setFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState({
    isbn: '',
    publisher: '',
    publicationYear: '',
    language: '',
    tags: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get<{ data: { data: Category[] } }>('/api/ebooks/categories');
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      showToast.error('Failed to fetch categories');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = {
      'PDF': 'application/pdf',
      'EPUB': 'application/epub+zip',
      'HTML': 'text/html'
    };

    if (selectedFile.type !== validTypes[format]) {
      showToast.error(`Please select a valid ${format} file`);
      e.target.value = '';
      return;
    }

    // Validate file size (50MB limit)
    if (selectedFile.size > 50 * 1024 * 1024) {
      showToast.error('File size must be less than 50MB');
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || !author.trim() || !category || !format) {
      showToast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    formData.append('author', author.trim());
    formData.append('description', description.trim());
    formData.append('category', category);
    formData.append('format', format);
    formData.append('metadata', JSON.stringify({
      ...metadata,
      tags: metadata.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }));

    try {
      await apiClient.post('/api/ebooks/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      showToast.success('eBook uploaded successfully');
      // Reset form
      setTitle('');
      setAuthor('');
      setDescription('');
      setCategory('');
      setFormat('PDF');
      setFile(null);
      setMetadata({
        isbn: '',
        publisher: '',
        publicationYear: '',
        language: '',
        tags: ''
      });
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Failed to upload eBook:', error);
      showToast.error('Failed to upload eBook');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Upload eBook</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Author *
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Format *
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'PDF' | 'EPUB' | 'HTML')}
              className="w-full p-2 border rounded"
              required
            >
              <option value="PDF">PDF</option>
              <option value="EPUB">EPUB</option>
              <option value="HTML">HTML</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            File *
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
            accept={format === 'PDF' ? '.pdf' : format === 'EPUB' ? '.epub' : '.html,.htm'}
            required
          />
          <p className="text-sm text-gray-500 mt-1">Maximum file size: 50MB</p>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-3">Additional Metadata</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                ISBN
              </label>
              <input
                type="text"
                value={metadata.isbn}
                onChange={(e) => setMetadata({ ...metadata, isbn: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Publisher
              </label>
              <input
                type="text"
                value={metadata.publisher}
                onChange={(e) => setMetadata({ ...metadata, publisher: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Publication Year
              </label>
              <input
                type="number"
                value={metadata.publicationYear}
                onChange={(e) => setMetadata({ ...metadata, publicationYear: e.target.value })}
                className="w-full p-2 border rounded"
                min="1800"
                max={new Date().getFullYear()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Language
              </label>
              <input
                type="text"
                value={metadata.language}
                onChange={(e) => setMetadata({ ...metadata, language: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Tags
            </label>
            <input
              type="text"
              value={metadata.tags}
              onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Enter tags separated by commas"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Uploading...' : 'Upload eBook'}
        </button>
      </form>
    </div>
  );
};
