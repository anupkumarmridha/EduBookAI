import type { IAuthService } from '../services/interfaces/IAuthService';
import type { IUserService } from '../services/interfaces/IUserService';

export interface ServiceContextType {
  authService: IAuthService;
  userService: IUserService;
}

export interface ServiceProviderProps {
  children: React.ReactNode;
  services?: Partial<ServiceContextType>;
}
