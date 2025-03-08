import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { CategoryManager } from '../components/admin/CategoryManager';
import { EBookUploader } from '../components/admin/EBookUploader';
import { EBookList } from '../components/admin/EBookList';

type Tab = 'categories' | 'upload' | 'library';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'library', label: 'eBook Library' },
    { id: 'upload', label: 'Upload eBook' },
    { id: 'categories', label: 'Categories' },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow">
        {activeTab === 'categories' && <CategoryManager />}
        {activeTab === 'upload' && <EBookUploader />}
        {activeTab === 'library' && <EBookList />}
      </div>
    </div>
  );
};
