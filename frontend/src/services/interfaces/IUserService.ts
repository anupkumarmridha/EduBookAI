import { AuthUser } from './IAuthService';

export interface IUserService {
  getAllUsers(): Promise<AuthUser[]>;
  updateUserRole(userId: string, role: 'user' | 'admin'): Promise<AuthUser>;
}
