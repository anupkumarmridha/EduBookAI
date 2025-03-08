import ApiClient from '../../utils/apiClient';
import { API_ENDPOINTS } from '../../constants/api';
import { STORAGE_KEYS } from '../../constants/storage';
import { 
  IAuthService, 
  LoginCredentials, 
  SignupCredentials, 
  AuthResponse 
} from '../interfaces/IAuthService';

export class AuthService implements IAuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await ApiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    if (response?.token) {
      this.setToken(response.token);
      if (response.refreshToken) {
        this.setRefreshToken(response.refreshToken);
      }
    }
    return response;
  }

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response = await ApiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, credentials);
    if (response?.token) {
      this.setToken(response.token);
      if (response.refreshToken) {
        this.setRefreshToken(response.refreshToken);
      }
    }
    return response;
  }

  async getProfile(): Promise<AuthResponse> {
    return ApiClient.get<AuthResponse>(API_ENDPOINTS.AUTH.PROFILE);
  }

  async forgotPassword(email: string): Promise<void> {
    await ApiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await ApiClient.post(`${API_ENDPOINTS.AUTH.RESET_PASSWORD}/${token}`, { password });
  }

  async verifyEmail(token: string): Promise<void> {
    await ApiClient.get(`${API_ENDPOINTS.AUTH.VERIFY_EMAIL}/${token}`);
  }

  logout(): void {
    this.removeToken();
    this.removeRefreshToken();
  }

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  private setToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  private removeToken(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  private removeRefreshToken(): void {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
}

// Singleton instance
export const authService = new AuthService();
