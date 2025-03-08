export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  role?: 'user' | 'admin';
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  isAdmin: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  refreshToken?: string;
}

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  signup(credentials: SignupCredentials): Promise<AuthResponse>;
  getProfile(): Promise<AuthResponse>;
  logout(): void;
  getToken(): string | null;
  getRefreshToken(): string | null;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<void>;
  verifyEmail(token: string): Promise<void>;
}
