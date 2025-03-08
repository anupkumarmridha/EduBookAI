import React, { useState, useEffect } from 'react';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../utils/apiClient';

interface Category {
  _id: string;
  name: string;
}

interface EBook {
  _id: string;
  title: string;
  author: string;
  description?: string;
  category: Category;
  format: 'PDF' | 'EPUB' | 'HTML';
  filePath: string;
  fileSize: number;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  uploadedAt: string;
  lastModifiedAt: string;
  metadata: {
    isbn?: string;
    publisher?: string;
    publicationYear?: number;
    language?: string;
    tags?: string[];
  };
}

export const EBookList: React.FC = () => {
  const [ebooks, setEbooks] = useState<EBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchCategories();
    fetchEBooks();
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

  const fetchEBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedFormat) params.append('format', selectedFormat);

      const response = await apiClient.get<{ data: { data: EBook[] } }>(
        `/api/ebooks?${params.toString()}`
      );
      setEbooks(response.data.data);
    } catch (error) {
      console.error('Failed to fetch ebooks:', error);
      showToast.error('Failed to fetch ebooks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this eBook?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/ebooks/${id}`);
      showToast.success('eBook deleted successfully');
      fetchEBooks();
    } catch (error) {
      console.error('Failed to delete ebook:', error);
      showToast.error('Failed to delete ebook');
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEBooks();
  };

  if (user?.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">eBook Library</h2>

      <form onSubmit={handleSearch} className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or author"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Formats</option>
              <option value="PDF">PDF</option>
              <option value="EPUB">EPUB</option>
              <option value="HTML">HTML</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {ebooks.map((ebook) => (
            <div
              key={ebook._id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{ebook.title}</h3>
                  <p className="text-gray-600">by {ebook.author}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDelete(ebook._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-2">
                {ebook.description && (
                  <p className="text-gray-700 mb-2">{ebook.description}</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Category:</span>{' '}
                    {ebook.category.name}
                  </div>
                  <div>
                    <span className="font-medium">Format:</span> {ebook.format}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span>{' '}
                    {formatFileSize(ebook.fileSize)}
                  </div>
                  <div>
                    <span className="font-medium">Uploaded:</span>{' '}
                    {new Date(ebook.uploadedAt).toLocaleDateString()}
                  </div>
                </div>

                {Object.keys(ebook.metadata).length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <h4 className="font-medium mb-1">Additional Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {ebook.metadata.isbn && (
                        <div>
                          <span className="font-medium">ISBN:</span>{' '}
                          {ebook.metadata.isbn}
                        </div>
                      )}
                      {ebook.metadata.publisher && (
                        <div>
                          <span className="font-medium">Publisher:</span>{' '}
                          {ebook.metadata.publisher}
                        </div>
                      )}
                      {ebook.metadata.publicationYear && (
                        <div>
                          <span className="font-medium">Year:</span>{' '}
                          {ebook.metadata.publicationYear}
                        </div>
                      )}
                      {ebook.metadata.language && (
                        <div>
                          <span className="font-medium">Language:</span>{' '}
                          {ebook.metadata.language}
                        </div>
                      )}
                    </div>
                    {ebook.metadata.tags && ebook.metadata.tags.length > 0 && (
                      <div className="mt-2">
                        <span className="font-medium">Tags:</span>{' '}
                        {ebook.metadata.tags.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {ebooks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No eBooks found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
