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
  VerificationStatus,
} from '../types';

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/* ────────────────────────────────────────────────────────────
 *  Smart base URL – works on emulator, real device, web
 * ──────────────────────────────────────────────────────────── */
const getDevBaseUrl = (): string => {
  if (!__DEV__) return 'https://your-production-api.com';          // production build

  /* 1️⃣ Android emulator → special loop-back alias */
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';

  /* 2️⃣ Physical device (Expo Go / custom dev-client)
        Try `hostUri` first (SDK 50+), then legacy `debuggerHost`. */
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.manifest as any)?.debuggerHost ??   // cast to any: silences TS2339
    '';

  // hostUri looks like "192.168.1.42:8081"
  const lanIp = hostUri.split(':').shift();
  if (lanIp) return `http://${lanIp}:3000`;

  /* 3️⃣ iOS simulator & Expo web */
  return 'http://localhost:3000';
};

const API_BASE_URL = getDevBaseUrl();




// Demo mode - set to true to use mock data instead of real API calls
const DEMO_MODE = false;

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

// Mock data for demo mode
const DEMO_DATA = {
  users: {
    host: {
      id: 'demo-host-1',
      email: 'host@demo.com',
      name: 'Demo Host',
      phone: '+39 123 456 7890',
      firebaseUid: 'demo-firebase-host',
      role: UserRole.HOST,
      location: {
        latitude: 41.9028,
        longitude: 12.4964,
      },
      verificationStatus: VerificationStatus.VERIFIED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as User,
    agent: {
      id: 'demo-agent-1',
      email: 'agent@demo.com',
      name: 'Demo Agent',
      phone: '+39 987 654 3210',
      firebaseUid: 'demo-firebase-agent',
      role: UserRole.AGENT,
      location: {
        latitude: 41.9028,
        longitude: 12.4964,
      },
      verificationStatus: VerificationStatus.VERIFIED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as User,
  },
  requests: [
    {
      id: 'demo-request-1',
      hostId: 'demo-host-1',
      agentId: undefined,
      propertyAddress: 'Via del Corso 123, Rome, Italy',
      propertyLocation: {
        latitude: 41.9028,
        longitude: 12.4964,
      },
      checkInTime: '15:00',
      guestName: 'John Smith',
      guestCount: 2,
      status: CheckInStatus.PENDING,
      fee: 35,
      platformFee: 5,
      agentPayout: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-request-2',
      hostId: 'demo-host-1',
      agentId: 'demo-agent-1',
      propertyAddress: 'Piazza Navona 45, Rome, Italy',
      propertyLocation: {
        latitude: 41.8986,
        longitude: 12.4735,
      },
      checkInTime: '16:00',
      guestName: 'Maria Garcia',
      guestCount: 4,
      status: CheckInStatus.IN_PROGRESS,
      fee: 40,
      platformFee: 6,
      agentPayout: 34,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ] as CheckInRequest[],
};

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

  // Demo mode delay helper
  private async delay(ms: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Auth Methods
  async signup(firebaseToken: string, role: UserRole, name: string): Promise<LoginResponse> {
    if (DEMO_MODE) {
      await this.delay(1500);
      const user = role === UserRole.HOST ? DEMO_DATA.users.host : DEMO_DATA.users.agent;
      const demoUser = { ...user, name };
      const token = 'demo-token-' + Date.now();
      
      this.authToken = token;
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(demoUser));
      
      return { token, user: demoUser };
    }

    try {
      const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/signup', {
        firebaseToken,
        role,
        name,
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

  async login(firebaseToken: string): Promise<LoginResponse> {
    if (DEMO_MODE) {
      await this.delay(1000);
      const user = DEMO_DATA.users.host; // Default to host for demo
      const token = 'demo-token-' + Date.now();
      
      this.authToken = token;
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return { token, user };
    }

    try {
      const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/login', {
        firebaseToken,
        role: UserRole.HOST, // Default to host role for new users
      });
      
      if (!response.data || !response.data.token || !response.data.user) {
        throw new Error('Invalid response from server');
      }

      const { token, user } = response.data;
      
      // Store token and user data
      this.authToken = token;
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error: unknown) {
      // Clear any existing auth data on error
      this.authToken = null;
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
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
    if (DEMO_MODE) {
      await this.delay(500);
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        return JSON.parse(userString);
      }
      return DEMO_DATA.users.host;
    }

    try {
      const response: AxiosResponse<User> = await this.api.get('/users/me');
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async updateLocation(location: LocationUpdateForm): Promise<User> {
    if (DEMO_MODE) {
      await this.delay(500);
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        const updatedUser = { ...user, location };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return DEMO_DATA.users.host;
    }

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
    if (DEMO_MODE) {
      await this.delay(1000);
      const newRequest: CheckInRequest = {
        id: 'demo-request-' + Date.now(),
        hostId: 'demo-host-1',
        agentId: undefined,
        propertyAddress: request.propertyAddress,
        propertyLocation: {
          latitude: 41.9028,
          longitude: 12.4964,
        },
        checkInTime: request.checkInTime.toTimeString().slice(0, 5),
        guestName: request.guestName,
        guestCount: request.guestCount,
        status: CheckInStatus.PENDING,
        fee: 35,
        platformFee: 5,
        agentPayout: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      DEMO_DATA.requests.unshift(newRequest);
      return newRequest;
    }

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
    if (DEMO_MODE) {
      await this.delay(500);
      return DEMO_DATA.requests;
    }

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
    if (DEMO_MODE) {
      await this.delay(500);
      return {
        totalRequests: 12,
        completedRequests: 8,
        totalSpent: 420
      };
    }

    try {
      const response = await this.api.get('/users/me/stats');
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async getNearbyRequests(latitude: number, longitude: number, radius: number = 10): Promise<NearbyRequestsResponse> {
    if (DEMO_MODE) {
      await this.delay(800);
      return {
        requests: DEMO_DATA.requests.filter(r => r.status === CheckInStatus.PENDING),
        total: 1
      };
    }

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
    if (DEMO_MODE) {
      await this.delay(500);
      const request = DEMO_DATA.requests.find(r => r.id === requestId);
      if (request) {
        return request;
      }
      // Return a default request if not found
      return DEMO_DATA.requests[0];
    }

    try {
      const response: AxiosResponse<CheckInRequest> = await this.api.get(`/check-in/${requestId}`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async acceptRequest(requestId: string): Promise<CheckInRequest> {
    if (DEMO_MODE) {
      await this.delay(800);
      const requestIndex = DEMO_DATA.requests.findIndex(r => r.id === requestId);
      if (requestIndex !== -1) {
        DEMO_DATA.requests[requestIndex] = {
          ...DEMO_DATA.requests[requestIndex],
          agentId: 'demo-agent-1',
          status: CheckInStatus.ACCEPTED,
          updatedAt: new Date().toISOString(),
        };
        return DEMO_DATA.requests[requestIndex];
      }
      return DEMO_DATA.requests[0];
    }

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
    if (DEMO_MODE) {
      await this.delay(500);
      const requestIndex = DEMO_DATA.requests.findIndex(r => r.id === requestId);
      if (requestIndex !== -1) {
        DEMO_DATA.requests[requestIndex] = {
          ...DEMO_DATA.requests[requestIndex],
          status,
          updatedAt: new Date().toISOString(),
        };
        return DEMO_DATA.requests[requestIndex];
      }
      return DEMO_DATA.requests[0];
    }

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
    if (DEMO_MODE) {
      await this.delay(500);
      const requestIndex = DEMO_DATA.requests.findIndex(r => r.id === requestId);
      if (requestIndex !== -1) {
        DEMO_DATA.requests[requestIndex] = {
          ...DEMO_DATA.requests[requestIndex],
          status: CheckInStatus.CANCELLED_HOST,
          updatedAt: new Date().toISOString(),
        };
        return DEMO_DATA.requests[requestIndex];
      }
      return DEMO_DATA.requests[0];
    }

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
    if (DEMO_MODE) {
      await this.delay(500);
      return {
        uploadUrl: 'https://demo-upload-url.com',
        fileKey: `demo-${requestId}-${fileName}`
      };
    }

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
    if (DEMO_MODE) {
      await this.delay(1500);
      return;
    }

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
    if (DEMO_MODE) {
      await this.delay(500);
      return [
        {
          id: 'demo-doc-1',
          checkInRequestId: requestId,
          uploaderId: 'demo-agent-1',
          fileKey: 'demo-property-photos.jpg',
          fileName: 'property_photos.jpg',
          fileType: 'image/jpeg',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: 'demo-doc-2',
          checkInRequestId: requestId,
          uploaderId: 'demo-agent-1',
          fileKey: 'demo-guest-id.pdf',
          fileName: 'guest_id.pdf',
          fileType: 'application/pdf',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        }
      ];
    }

    try {
      const response: AxiosResponse<Document[]> = await this.api.get(`/documents/${requestId}`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async getDocumentDownloadUrl(documentId: string): Promise<{ downloadUrl: string }> {
    if (DEMO_MODE) {
      await this.delay(500);
      return {
        downloadUrl: 'https://demo-download-url.com'
      };
    }

    try {
      const response = await this.api.get(`/documents/${documentId}/download-url`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Payment Methods
  async createPaymentIntent(requestId: string): Promise<PaymentIntent> {
    if (DEMO_MODE) {
      await this.delay(1000);
      return {
        id: 'demo-payment-intent-' + Date.now(),
        clientSecret: 'demo-client-secret',
        amount: 3500, // €35.00 in cents
        currency: 'eur',
        status: 'requires_payment_method',
      };
    }

    try {
      const response: AxiosResponse<PaymentIntent> = await this.api.post('/payments/create-intent', {
        requestId,
      });
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<{ success: boolean }> {
    if (DEMO_MODE) {
      await this.delay(2000);
      return { success: true };
    }

    try {
      const response = await this.api.post('/payments/confirm', {
        paymentIntentId,
      });
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Error handling
  private handleError(error: unknown): Error {
    if (hasErrorResponse(error)) {
      // Server responded with an error
      const message = error.response.data?.message || error.response.data?.error || 'Server error';
      return new Error(`API Error (${error.response.status}): ${message}`);
    } else if (isAxiosError(error)) {
      // Network error or other Axios error
      if (error.message === 'Network Error') {
        return new Error('Network error. Please check your connection and try again.');
      }
      return new Error(error.message || 'API request failed');
    }
    // Unknown error
    return new Error((error as Error)?.message || 'An unexpected error occurred');
  }

  // Push notifications
  async registerPushToken(expoPushToken: string): Promise<{ success: boolean }> {
    if (DEMO_MODE) {
      await this.delay(500);
      return { success: true };
    }

    try {
      const response = await this.api.post('/notifications/register', {
        expoPushToken,
      });
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    if (DEMO_MODE) {
      await this.delay(300);
      return { status: 'demo_mode_active' };
    }

    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }
}

export default new ApiService();
