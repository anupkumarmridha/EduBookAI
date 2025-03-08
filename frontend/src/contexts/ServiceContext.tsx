import React, { createContext } from 'react';
import { authService } from '../services/implementations/AuthService';
import { userService } from '../services/implementations/UserService';
import type { ServiceContextType, ServiceProviderProps } from '../types/service';

export const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ 
  children,
  services = {} 
}) => {
  // Allow dependency injection for testing while providing default implementations
  const value: ServiceContextType = React.useMemo(() => ({
    authService: services.authService || authService,
    userService: services.userService || userService
  }), [services]);

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
};
