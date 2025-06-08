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
  CheckInStatus,
} from '../types';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' // Development
  : 'https://your-production-api.com'; // Production

// Type-safe status union for updateRequestStatus
type CheckInStatusUpdate = CheckInStatus.PENDING | CheckInStatus.ACCEPTED | CheckInStatus.IN_PROGRESS | CheckInStatus.COMPLETED | CheckInStatus.CANCELLED_HOST | CheckInStatus.CANCELLED_AGENT | CheckInStatus.EXPIRED;

// Filter options for consolidated request method
type RequestFilter = 'active' | 'recent' | 'all';

// Type guard for checking if error is an axios error
function isAxiosError(error: unknown): error is { response?: { status: number; data?: any }; message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

// Type guard for checking if error has a response
function hasErrorResponse(error: unknown): error is { response: { status: number; data?: any }; message: string } {
  return isAxiosError(error) && error.response !== undefined;
}

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
        if (hasErrorResponse(error) && error.response.status === 401) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      return null;
    }
  }

  // User Methods
  async getProfile(): Promise<User> {
    try {
      const response: AxiosResponse<User> = await this.api.get('/users/me');
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async updateLocation(location: LocationUpdateForm): Promise<User> {
    try {
      const response: AxiosResponse<User> = await this.api.patch('/users/me/location', location);
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Check-In Request Methods - Consolidated and improved
  async createCheckInRequest(request: CreateRequestForm): Promise<CheckInRequest> {
    try {
      const response: AxiosResponse<CheckInRequest> = await this.api.post('/check-in', request);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * Consolidated method that replaces both getMyRequests() and getMyCheckInRequests()
   * @param filter - Filter for request types: 'active', 'recent', or 'all'
   * @returns Array of check-in requests
   */
  async getMyRequests(filter: RequestFilter = 'all'): Promise<CheckInRequest[]> {
    try {
      const response: AxiosResponse<CheckInRequest[]> = await this.api.get('/check-in/my-requests', {
        params: { filter },
      });
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async getHostStats(): Promise<{ totalRequests: number; completedRequests: number; totalSpent: number }> {
    try {
      const response = await this.api.get('/users/me/stats');
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async getNearbyRequests(latitude: number, longitude: number, radius: number = 10): Promise<NearbyRequestsResponse> {
    try {
      const response: AxiosResponse<NearbyRequestsResponse> = await this.api.get('/check-in/nearby', {
        params: { latitude, longitude, radius },
      });
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async getRequestDetails(requestId: string): Promise<CheckInRequest> {
    try {
      const response: AxiosResponse<CheckInRequest> = await this.api.get(`/check-in/${requestId}`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async acceptRequest(requestId: string): Promise<CheckInRequest> {
    try {
      const response: AxiosResponse<CheckInRequest> = await this.api.patch(`/check-in/${requestId}/accept`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * Update request status with type-safe status parameter
   * @param requestId - The request ID to update
   * @param status - Strict union type of valid CheckInStatus values
   * @returns Updated CheckInRequest
   */
  async updateRequestStatus(requestId: string, status: CheckInStatusUpdate): Promise<CheckInRequest> {
    try {
      const response: AxiosResponse<CheckInRequest> = await this.api.patch(`/check-in/${requestId}/status`, {
        status,
      });
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async cancelRequest(requestId: string, reason?: string): Promise<CheckInRequest> {
    try {
      const response: AxiosResponse<CheckInRequest> = await this.api.patch(`/check-in/${requestId}/cancel`, {
        reason,
      });
      return response.data;
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async getDocuments(requestId: string): Promise<Document[]> {
    try {
      const response: AxiosResponse<Document[]> = await this.api.get(`/documents/${requestId}`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async getDocumentDownloadUrl(documentId: string): Promise<{ downloadUrl: string }> {
    try {
      const response = await this.api.get(`/documents/${documentId}/download-url`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Payment Methods
  async createPaymentIntent(requestId: string): Promise<PaymentIntent> {
    try {
      const response: AxiosResponse<PaymentIntent> = await this.api.post('/payments/create-intent', {
        checkInRequestId: requestId,
      });
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<{ success: boolean }> {
    try {
      const response = await this.api.post('/payments/confirm', {
        paymentIntentId,
      });
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Enhanced error handling with proper type guards
  private handleError(error: unknown): Error {
    if (hasErrorResponse(error)) {
      const message = error.response.data?.message || error.message || 'An error occurred';
      const statusCode = error.response.status;
      return new Error(`${statusCode}: ${message}`);
    }
    
    if (isAxiosError(error)) {
      return new Error(error.message || 'Network error occurred');
    }
    
    if (error instanceof Error) {
      return error;
    }
    
    // Fallback for unknown error types
    return new Error('An unknown error occurred');
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }
}

export default new ApiService();
