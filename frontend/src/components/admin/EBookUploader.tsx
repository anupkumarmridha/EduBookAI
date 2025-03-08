import React, { useState, useEffect, useCallback } from 'react';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../utils/apiClient';
import { Tooltip } from 'react-tooltip';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  TagIcon,
  LanguageIcon,
  CalendarIcon,
  BuildingLibraryIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';
import { RequestConfig, UploadProgressEvent } from '../../types/api';

interface Category {
  _id: string;
  name: string;
}

interface MetadataType {
  isbn: string;
  publisher: string;
  publicationYear: string;
  language: string;
  tags: string;
}

const ALLOWED_FILE_TYPES = {
  PDF: 'application/pdf',
  EPUB: 'application/epub+zip',
  HTML: 'text/html',
} as const;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const EBookUploader: React.FC = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [format, setFormat] = useState<keyof typeof ALLOWED_FILE_TYPES>('PDF');
  const [file, setFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [metadata, setMetadata] = useState<MetadataType>({
    isbn: '',
    publisher: '',
    publicationYear: '',
    language: '',
    tags: '',
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

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'title':
        return !value.trim() ? 'Title is required' : '';
      case 'author':
        return !value.trim() ? 'Author is required' : '';
      case 'category':
        return !value ? 'Category is required' : '';
      case 'isbn': {
        return value && !/^(?:\d{10}|\d{13})$/.test(value) ? 'Invalid ISBN format' : '';
      }
      case 'publicationYear': {
        const year = parseInt(value);
        return value && (year < 1800 || year > new Date().getFullYear())
          ? 'Invalid publication year'
          : '';
      }
      default:
        return '';
    }
  };

  const handleFieldChange = (
    name: string,
    value: string,
    metadata: boolean = false
  ) => {
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));

    if (metadata) {
      setMetadata((prev) => ({ ...prev, [name]: value }));
    } else {
      switch (name) {
        case 'title': {
          setTitle(value);
          break;
        }
        case 'author': {
          setAuthor(value);
          break;
        }
        case 'description': {
          setDescription(value);
          break;
        }
        case 'category': {
          setCategory(value);
          break;
        }
      }
    }
  };

  const validateFile = (file: File): string => {
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 50MB';
    }
    if (file.type !== ALLOWED_FILE_TYPES[format]) {
      return `Please select a valid ${format} file`;
    }
    return '';
  };

  const handleFileChange = useCallback((file: File | null) => {
    if (!file) {
      setFile(null);
      setErrors((prev) => ({ ...prev, file: 'File is required' }));
      return;
    }

    const error = validateFile(file);
    if (error) {
      setErrors((prev) => ({ ...prev, file: error }));
      showToast.error(error);
      return;
    }

    setFile(file);
    setErrors((prev) => ({ ...prev, file: '' }));
  }, [format]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  }, [handleFileChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    newErrors.title = validateField('title', title);
    newErrors.author = validateField('author', author);
    newErrors.category = validateField('category', category);
    newErrors.isbn = validateField('isbn', metadata.isbn);
    newErrors.publicationYear = validateField('publicationYear', metadata.publicationYear);
    if (!file) newErrors.file = 'File is required';

    if (Object.values(newErrors).some(error => error)) {
      setErrors(newErrors);
      showToast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file as File);
    formData.append('title', title.trim());
    formData.append('author', author.trim());
    formData.append('description', description.trim());
    formData.append('category', category);
    formData.append('format', format);
    formData.append('metadata', JSON.stringify({
      ...metadata,
      tags: metadata.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }));

    const config: RequestConfig = {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent: UploadProgressEvent) => {
        const progress = progressEvent.total
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 0;
        setUploadProgress(progress);
      },
    };

    try {
      await apiClient.post('/api/ebooks/upload', formData, config);
      
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
      setErrors({});
      setUploadProgress(0);
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
    return (
      <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center text-red-700">
          <ExclamationCircleIcon className="w-5 h-5 mr-2" />
          <span>Access denied. Admin privileges required.</span>
        </div>
      </div>
    );
  }

  const renderFieldError = (fieldName: string) => {
    if (!errors[fieldName]) return null;
    return (
      <p role="alert" className="mt-1 text-sm text-red-600">
        {errors[fieldName]}
      </p>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CloudArrowUpIcon className="w-7 h-7 text-blue-500" />
          Upload eBook
        </h2>
        <p className="mt-1 text-gray-600">Add new eBooks to your library with detailed metadata</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-blue-500" />
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm
                  ${errors.title
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              {renderFieldError('title')}
            </div>

            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700">
                Author <span className="text-red-500">*</span>
              </label>
              <input
                id="author"
                type="text"
                value={author}
                onChange={(e) => handleFieldChange('author', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm
                  ${errors.author
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                aria-invalid={!!errors.author}
                aria-describedby={errors.author ? 'author-error' : undefined}
              />
              {renderFieldError('author')}
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CloudArrowUpIcon className="w-5 h-5 text-blue-500" />
            File Upload
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm
                  ${errors.category
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                aria-invalid={!!errors.category}
                aria-describedby={errors.category ? 'category-error' : undefined}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {renderFieldError('category')}
            </div>

            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700">
                Format <span className="text-red-500">*</span>
              </label>
              <select
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value as keyof typeof ALLOWED_FILE_TYPES)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {Object.keys(ALLOWED_FILE_TYPES).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors
              ${dragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
              }
              ${errors.file ? 'border-red-300 bg-red-50' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept={`.${format.toLowerCase()}`}
              aria-invalid={!!errors.file}
              aria-describedby={errors.file ? 'file-error' : undefined}
            />
            
            <div className="text-center">
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  {file
                    ? `Selected file: ${file.name}`
                    : `Drag and drop your ${format} file here, or click to select`
                  }
                </p>
                <p className="mt-1 text-xs text-gray-500">Maximum file size: 50MB</p>
              </div>
            </div>
          </div>
          {renderFieldError('file')}

          {loading && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                Uploading: {uploadProgress}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-blue-500" />
            Additional Metadata
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                ISBN
                <Tooltip id="isbn-help" />
                <InformationCircleIcon
                  className="h-4 w-4 text-gray-400 cursor-help"
                  data-tooltip-id="isbn-help"
                  data-tooltip-content="Enter 10 or 13 digit ISBN number"
                />
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <QrCodeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="isbn"
                  type="text"
                  value={metadata.isbn}
                  onChange={(e) => handleFieldChange('isbn', e.target.value, true)}
                  className={`pl-10 block w-full rounded-md
                    ${errors.isbn
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                />
              </div>
              {renderFieldError('isbn')}
            </div>

            <div>
              <label htmlFor="publisher" className="block text-sm font-medium text-gray-700">
                Publisher
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingLibraryIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="publisher"
                  type="text"
                  value={metadata.publisher}
                  onChange={(e) => handleFieldChange('publisher', e.target.value, true)}
                  className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="publicationYear" className="block text-sm font-medium text-gray-700">
                Publication Year
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="publicationYear"
                  type="number"
                  value={metadata.publicationYear}
                  onChange={(e) => handleFieldChange('publicationYear', e.target.value, true)}
                  min="1800"
                  max={new Date().getFullYear()}
                  className={`pl-10 block w-full rounded-md
                    ${errors.publicationYear
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                />
              </div>
              {renderFieldError('publicationYear')}
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                Language
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LanguageIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="language"
                  type="text"
                  value={metadata.language}
                  onChange={(e) => handleFieldChange('language', e.target.value, true)}
                  className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <TagIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="tags"
                type="text"
                value={metadata.tags}
                onChange={(e) => handleFieldChange('tags', e.target.value, true)}
                className="pl-10 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter tags separated by commas"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => {
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
              setErrors({});
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
          >
            Clear Form
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`
              inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm
              text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
            `}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                Upload eBook
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
