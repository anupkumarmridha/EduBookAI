import { useContext } from 'react';
import { ServiceContext } from '../contexts/ServiceContext';


export const useServices = () => {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};

// Convenience hooks for individual services
export const useAuthService = () => useServices().authService;
export const useUserService = () => useServices().userService;
