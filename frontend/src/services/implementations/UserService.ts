import ApiClient from '../../utils/apiClient';
import { API_ENDPOINTS } from '../../constants/api';
import { IUserService } from '../interfaces/IUserService';
import { AuthUser } from '../interfaces/IAuthService';

export class UserService implements IUserService {
  async getAllUsers(): Promise<AuthUser[]> {
    try {
      return await ApiClient.get<AuthUser[]>(API_ENDPOINTS.ADMIN.USERS);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<AuthUser> {
    try {
      return await ApiClient.patch<AuthUser>(
        API_ENDPOINTS.ADMIN.USER_ROLE(userId),
        { role }
      );
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }
}

// Singleton instance
export const userService = new UserService();
