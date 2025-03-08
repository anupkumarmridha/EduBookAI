import React, { useState, useEffect } from 'react';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../utils/apiClient';
import { Dialog } from '@headlessui/react';
import { RequestConfig, DownloadResponse } from '../../types/api';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  TagIcon,
  CalendarIcon,
  LanguageIcon,
  BuildingLibraryIcon,
  QrCodeIcon,
  TrashIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  FolderIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<EBook | null>(null);
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

  const handleDelete = async (ebook: EBook) => {
    setBookToDelete(ebook);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!bookToDelete) return;

    try {
      await apiClient.delete(`/api/ebooks/${bookToDelete._id}`);
      showToast.success('eBook deleted successfully');
      fetchEBooks();
    } catch (error) {
      console.error('Failed to delete ebook:', error);
      showToast.error('Failed to delete ebook');
    } finally {
      setDeleteModalOpen(false);
      setBookToDelete(null);
    }
  };

  const handleDownload = async (ebook: EBook) => {
    try {
      const config: RequestConfig = {
        responseType: 'blob'
      };
      
      const response = await apiClient.get<DownloadResponse>(
        `/api/ebooks/${ebook._id}/download`,
        config
      );
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${ebook.title}.${ebook.format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download ebook:', error);
      showToast.error('Failed to download ebook');
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
    return (
      <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center text-red-700">
          <ExclamationCircleIcon className="w-5 h-5 mr-2" />
          <span>Access denied. Admin privileges required.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpenIcon className="w-7 h-7 text-blue-500" />
          eBook Library
        </h2>
        <p className="mt-1 text-gray-600">Manage and organize your eBook collection</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-blue-500" />
            Filter eBooks
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or author"
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FolderIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="format"
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Formats</option>
                  <option value="PDF">PDF</option>
                  <option value="EPUB">EPUB</option>
                  <option value="HTML">HTML</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              Search
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {ebooks.map((ebook) => (
            <div
              key={ebook._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{ebook.title}</h3>
                  <p className="text-gray-600">by {ebook.author}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleDownload(ebook)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
                    aria-label={`Download ${ebook.title}`}
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(ebook)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md"
                    aria-label={`Delete ${ebook.title}`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {ebook.description && (
                  <p className="text-gray-700 mb-4">{ebook.description}</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FolderIcon className="h-4 w-4 text-gray-400" />
                    <span>{ebook.category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                    <span>{ebook.format}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowDownTrayIcon className="h-4 w-4 text-gray-400" />
                    <span>{formatFileSize(ebook.fileSize)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <span>{new Date(ebook.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {Object.keys(ebook.metadata).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Additional Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {ebook.metadata.isbn && (
                        <div className="flex items-center gap-2">
                          <QrCodeIcon className="h-4 w-4 text-gray-400" />
                          <span>{ebook.metadata.isbn}</span>
                        </div>
                      )}
                      {ebook.metadata.publisher && (
                        <div className="flex items-center gap-2">
                          <BuildingLibraryIcon className="h-4 w-4 text-gray-400" />
                          <span>{ebook.metadata.publisher}</span>
                        </div>
                      )}
                      {ebook.metadata.publicationYear && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span>{ebook.metadata.publicationYear}</span>
                        </div>
                      )}
                      {ebook.metadata.language && (
                        <div className="flex items-center gap-2">
                          <LanguageIcon className="h-4 w-4 text-gray-400" />
                          <span>{ebook.metadata.language}</span>
                        </div>
                      )}
                    </div>
                    {ebook.metadata.tags && ebook.metadata.tags.length > 0 && (
                      <div className="mt-3 flex items-start gap-2">
                        <TagIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex flex-wrap gap-2">
                          {ebook.metadata.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {ebooks.length === 0 && (
            <div className="text-center py-12">
              <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No eBooks found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search filters or upload a new eBook.
              </p>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
              Confirm Deletion
            </Dialog.Title>

            <div className="mt-4">
              <p className="text-gray-600">
                Are you sure you want to delete "{bookToDelete?.title}"? This action cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={confirmDelete}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};
