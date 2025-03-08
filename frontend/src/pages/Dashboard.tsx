import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
                >
                  <Cog6ToothIcon className="h-5 w-5 mr-2" />
                  Admin Panel
                </Link>
              )}
              <span className="text-gray-600">
                {user?.email} ({user?.role})
              </span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Welcome to your Dashboard</h2>
            <p className="text-gray-600 mb-4">
              This is a protected page. Only authenticated users can see this content.
            </p>
            {user?.role === 'admin' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Cog6ToothIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold text-blue-900">Admin Access</h3>
                </div>
                <p className="text-blue-800 mb-4">
                  You have admin privileges. You can access additional features through the admin panel.
                </p>
                <Link
                  to="/admin"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Cog6ToothIcon className="h-5 w-5 mr-2" />
                  Go to Admin Panel
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
