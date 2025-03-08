import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Cog6ToothIcon className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">Loading</h2>
          <p className="mt-1 text-sm text-gray-500">Please wait while we verify your access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Save the attempted URL for redirection after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full px-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
            <div className="text-center">
              <h2 className="text-lg font-medium text-red-900">Access Denied</h2>
              <p className="mt-2 text-sm text-red-600">
                You need administrator privileges to access this page.
              </p>
              <div className="mt-4">
                <Navigate to="/" replace />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
