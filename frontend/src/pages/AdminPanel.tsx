import React, { Suspense } from 'react';
import { useAuth } from '../hooks/useAuth';
import { CategoryManager } from '../components/admin/CategoryManager';
import { EBookUploader } from '../components/admin/EBookUploader';
import { EBookList } from '../components/admin/EBookList';
import { Tooltip } from 'react-tooltip';
import {
  BookOpenIcon,
  FolderIcon,
  CloudArrowUpIcon, // Updated icon name
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

type TabType = 'library' | 'upload' | 'categories';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-48">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabType>('library');
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div className="p-4" role="alert">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <ExclamationCircleIcon className="w-5 h-5 mr-2" />
          <span>Access denied. Admin privileges required.</span>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'library' as TabType,
      label: 'eBook Library',
      icon: BookOpenIcon,
      tooltip: 'View and manage your eBook collection',
      component: EBookList,
    },
    {
      id: 'upload' as TabType,
      label: 'Upload eBook',
      icon: CloudArrowUpIcon, // Updated icon name
      tooltip: 'Add new eBooks to your library',
      component: EBookUploader,
    },
    {
      id: 'categories' as TabType,
      label: 'Categories',
      icon: FolderIcon,
      tooltip: 'Manage eBook categories and metadata',
      component: CategoryManager,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your eBook library and categories</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <Tab.Group selectedIndex={tabs.findIndex(t => t.id === activeTab)} onChange={index => setActiveTab(tabs[index].id)}>
            <Tab.List className="flex p-2 space-x-2 bg-gray-100 rounded-t-xl">
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  className={({ selected }) => 
                    `flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    transition-all duration-200 ease-in-out
                    ${
                      selected
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                  data-tooltip-id={`tooltip-${tab.id}`}
                  data-tooltip-content={tab.tooltip}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels className="p-6">
              {tabs.map((tab) => (
                <Tab.Panel
                  key={tab.id}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                >
                  <ErrorBoundary onReset={() => setActiveTab(tab.id)}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <tab.component />
                    </Suspense>
                  </ErrorBoundary>
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>

      {/* Tooltips */}
      {tabs.map((tab) => (
        <Tooltip
          key={`tooltip-${tab.id}`}
          id={`tooltip-${tab.id}`}
          place="bottom"
          className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm shadow-lg z-50"
        />
      ))}
    </div>
  );
};
