import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiResponse,
  LoginResponse,
  User,
  CheckInRequest,
  CreateRequestForm,
  LocationUpdateForm,
  NearbyRequestsResponse,
  Document,
  PaymentIntent,
  UploadResponse,
  UserRole,
} from '../types';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' // Development
  : 'https://your-production-api.com'; // Production

class ApiService {
  private api: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        if (!this.authToken) {
          this.authToken = await AsyncStorage.getItem('authToken');
        }
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth Methods
  async login(firebaseToken: string): Promise<LoginResponse> {
    try {
      const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/login', {
        firebaseToken,
      });
      
      const { token, user } = response.data;
      this.authToken = token;
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    this.authToken = null;
    await AsyncStorage.multiRemove(['authToken', 'user']);
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      return null;
    }
  }

  // User Methods
  async getProfile(): Promise<User> {
    try {
      const response: AxiosResponse<User> = await this.api.get('/users/me');
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateLocation(location: LocationUpdateForm): Promise<User> {
    try {
      const response: AxiosResponse<User> = await this.api.patch('/users/me/location', location);
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Check-In Request Methods
  async createCheckInRequest(request: CreateRequestForm): Promise<CheckInRequest> {
    try {
      const response: AxiosResponse<CheckInRequest> = await this.api.post('/check-in', request);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getMyRequests(): Promise<CheckInRequest[]> {
    try {
      const response: AxiosResponse<CheckInRequest[]> = await this.api.get('/check-in/my-requests');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getMyCheckInRequests(filter: 'active' | 'recent' | 'all' = 'all'): Promise<{ data: CheckInRequest[] }> {
    try {
      const response: AxiosResponse<CheckInRequest[]> = await this.api.get('/check-in/my-requests', {
        params: { filter },
      });
      return { data: response.data };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getHostStats(): Promise<{ data: { totalRequests: number; completedRequests: number; totalSpent: number } }> {
    try {
      const response = await this.api.get('/users/me/stats');
      return { data: response.data };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getNearbyRequests(latitude: number, longitude: number, radius: number = 10): Promise<NearbyRequestsResponse> {
    try {
      const response: AxiosResponse<NearbyRequestsResponse> = await this.api.get('/check-in/nearby', {
        params: { latitude, longitude, radius },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getRequestDetails(requestId: string): Promise<CheckInRequest> {
    try {
      const response: AxiosResponse<CheckInRequest> = await this.api.get(`/check-in/${requestId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async acceptRequest(requestId: string): Promise<CheckInRequest> {
    try {
      const response: AxiosResponse<CheckInRequest> = await this.api.patch(`/check-in/${requestId}/accept`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateRequestStatus(requestId: string, status: string): Promise<CheckInRequest> {
    try {
      const response: AxiosResponse<CheckInRequest> = await this.api.patch(`/check-in/${requestId}/status`, {
        status,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async cancelRequest(requestId: string, reason?: string): Promise<CheckInRequest> {
    try {
      const response: AxiosResponse<CheckInRequest> = await this.api.patch(`/check-in/${requestId}/cancel`, {
        reason,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Document Methods
  async getUploadUrl(requestId: string, fileName: string, fileType: string): Promise<{ uploadUrl: string; fileKey: string }> {
    try {
      const response = await this.api.post('/documents/upload-url', {
        requestId,
        fileName,
        fileType,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async uploadDocument(uploadUrl: string, file: any): Promise<void> {
    try {
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getDocuments(requestId: string): Promise<Document[]> {
    try {
      const response: AxiosResponse<Document[]> = await this.api.get(`/documents/${requestId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getDocumentDownloadUrl(documentId: string): Promise<{ downloadUrl: string }> {
    try {
      const response = await this.api.get(`/documents/${documentId}/download-url`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Payment Methods
  async createPaymentIntent(requestId: string): Promise<PaymentIntent> {
    try {
      const response: AxiosResponse<PaymentIntent> = await this.api.post('/payments/create-intent', {
        requestId,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<{ success: boolean }> {
    try {
      const response = await this.api.post('/payments/confirm', {
        paymentIntentId,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Utility Methods
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;
