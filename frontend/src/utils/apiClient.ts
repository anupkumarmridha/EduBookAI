import axios from 'axios';
import { STORAGE_KEYS } from '../constants/storage';

const API_URL = import.meta.env.VITE_API_URL;

// Generic API response type
export interface ApiResponse<T> {
  message?: string;
  data: T;
}

// Request configuration type
interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
}

// Error type
interface ApiError {
  status?: number;
  message: string;
}

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

let isRefreshing = false;
interface QueueItem {
  resolve: (value: string | null) => void;
  reject: (reason?: Error) => void;
}

let failedQueue: QueueItem[] = [];

const processQueue = (error: Error | null, token: string | null = null): void => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    const apiError: ApiError = {
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    };
    return Promise.reject(apiError);
  }
);

// Response interceptor for handling common errors
axiosInstance.interceptors.response.use(
  (response) => {
    const responseData = response.data as { data?: unknown };
    if (responseData && Object.prototype.hasOwnProperty.call(responseData, 'data')) {
      response.data = responseData.data;
    }
    return response;
  },
  async (error: unknown) => {
    interface AxiosConfig {
      url: string;
      method?: string;
      baseURL?: string;
      headers?: Record<string, string>;
      data?: Record<string, unknown>;
      params?: Record<string, unknown>;
      _retry?: boolean;
      [key: string]: unknown;
    }

    interface AxiosErrorResponse {
      response?: {
        status: number;
        data?: { message?: string };
      };
      config?: AxiosConfig;
    }

    const axiosError = error as AxiosErrorResponse;
    const originalRequest = axiosError.config;
    if (!originalRequest) return Promise.reject(error);

    if (axiosError.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        try {
          const token = await new Promise<string | null>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          if (originalRequest?.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          const config: AxiosConfig = {
            ...originalRequest,
            url: originalRequest.url || ''
          };
          return axiosInstance(config);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        interface RefreshTokenResponse {
          accessToken: string;
          refreshToken: string;
        }

        const response = await axios.post<RefreshTokenResponse>(`${API_URL}/auth/refresh-token`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem(STORAGE_KEYS.TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

        processQueue(null, accessToken);
        if (originalRequest?.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        const config: AxiosConfig = {
          ...originalRequest,
          url: originalRequest.url || ''
        };
        return axiosInstance(config);
      } catch (refreshError) {
        processQueue(new Error('Failed to refresh token'));
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const apiError: ApiError = {
      status: axiosError.response?.status,
      message: axiosError.response?.data?.message || 'An error occurred'
    };

    return Promise.reject(apiError);
  }
);

// Generic API client class
class ApiClient {
  static async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await axiosInstance.get<ApiResponse<T>>(url, config);
    return response.data as T;
  }

  static async post<T, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<T> {
    const response = await axiosInstance.post<ApiResponse<T>>(url, data, config);
    return response.data as T;
  }

  static async put<T, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<T> {
    const response = await axiosInstance.put<ApiResponse<T>>(url, data, config);
    return response.data as T;
  }

  static async patch<T, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<T> {
    const response = await axiosInstance.patch<ApiResponse<T>>(url, data, config);
    return response.data as T;
  }

  static async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await axiosInstance.delete<ApiResponse<T>>(url, config);
    return response.data as T;
  }
}

export default ApiClient;
