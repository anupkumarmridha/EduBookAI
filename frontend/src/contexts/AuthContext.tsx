import React, { createContext, useState, useEffect } from 'react';
import { AuthUser } from '../services/interfaces/IAuthService';
import { useAuthService } from '../hooks/useServices';
import { showToast } from '../utils/toast';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authService = useAuthService();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshAttempted, setRefreshAttempted] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const token = authService.getToken();
      const refreshToken = authService.getRefreshToken();

      if (!token && !refreshToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getProfile();
        setUser(response.user);
      } catch (err) {
        console.error('Failed to load user profile:', err);
        // Clear tokens on error
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
        setRefreshAttempted(true);
      }
    };

    if (!refreshAttempted) {
      loadUser();
    }
  }, [authService, refreshAttempted]);

  const login = React.useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const response = await authService.login({ email, password });
      setUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during login';
      setError(message);
      showToast.error(message);
      throw err;
    }
  }, [authService]);

  const signup = React.useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const response = await authService.signup({ email, password });
      setUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during signup';
      setError(message);
      showToast.error(message);
      throw err;
    }
  }, [authService]);

  const logout = React.useCallback(() => {
    authService.logout();
    setUser(null);
    setRefreshAttempted(false); // Reset refresh attempt state
  }, [authService]);

  const isAdmin = React.useCallback(() => user?.role === 'admin', [user]);

  const value = React.useMemo(() => ({
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAdmin
  }), [user, loading, error, login, signup, logout, isAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
