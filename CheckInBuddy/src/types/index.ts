// Navigation Imports
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';

// User Types
export enum UserRole {
  HOST = 'host',
  AGENT = 'agent',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  firebaseUid: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  verificationStatus: VerificationStatus;
  stripeAccountId?: string;
  createdAt: string;
  updatedAt: string;
}

// Check-In Types
export enum CheckInStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED_HOST = 'cancelled_host',
  CANCELLED_AGENT = 'cancelled_agent',
  EXPIRED = 'expired',
}

export interface CheckInRequest {
  id: string;
  hostId: string;
  agentId?: string;
  propertyAddress: string;
  propertyLocation?: {
    latitude: number;
    longitude: number;
  };
  guestName: string;
  guestCount: number;
  checkInTime: string;
  status: CheckInStatus;
  fee: number;
  platformFee: number;
  agentPayout: number;
  paymentIntentId?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  host?: User;
  agent?: User;
  documents?: Document[];
  distance?: number; // For nearby requests
}

// Document Types
export interface Document {
  id: string;
  checkInRequestId: string;
  uploaderId: string;
  fileKey: string;
  fileName: string;
  fileType: string;
  expiresAt: string;
  createdAt: string;
  uploader?: User;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  accessToken: string;      // ← rename
  refreshToken?: string;
  user: User;
}

export interface NearbyRequestsResponse {
  requests: CheckInRequest[];
  total: number;
}

// Navigation Types
export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type AppStackParamList = {
  HostTabs: undefined;
  AgentTabs: undefined;
  CreateRequest: undefined;
  RequestDetails: { requestId: string };
  DocumentUpload: { requestId: string };
  Payment: { requestId: string };
  Profile: undefined;
};

export type HostTabParamList = {
  Dashboard: undefined;
  Requests: undefined;
  Profile: undefined;
};

export type AgentTabParamList = {
  Map: undefined;
  MyRequests: undefined;
  Profile: undefined;
};

export type SharedStackParamList = {
  RequestDetails: { requestId: string };
  DocumentUpload: { requestId: string };
  Payment: { requestId: string };
  Profile: undefined;
};

// Navigation Prop Types
export type HostTabNavigationProp = BottomTabNavigationProp<HostTabParamList>;
export type AgentTabNavigationProp = BottomTabNavigationProp<AgentTabParamList>;
export type SharedStackNavigationProp = StackNavigationProp<SharedStackParamList>;
export type AppStackNavigationProp = StackNavigationProp<AppStackParamList>;

export type SharedStackRouteProp<T extends keyof SharedStackParamList> = RouteProp<SharedStackParamList, T>;

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  role: UserRole;
}

export interface CreateRequestForm {
  propertyAddress: string;
  guestName: string;
  guestCount: number;
  checkInTime: Date;
  specialInstructions?: string;
}

export interface LocationUpdateForm {
  latitude: number;
  longitude: number;
}

// Payment Types
export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

// Error Types
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
}

export interface LocationPermission {
  granted: boolean;
  canAskAgain?: boolean;
}

// File Upload Types
export interface FileUpload {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export interface UploadResponse {
  success: boolean;
  fileKey?: string;
  downloadUrl?: string;
  error?: string;
}

// Notification Types
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Map Types
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapMarker {
  id: string;
  coordinate: Location;
  title: string;
  description?: string;
  type: 'request' | 'agent' | 'property';
}

// Filter Types
export interface RequestFilters {
  status?: CheckInStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  maxDistance?: number;
}

// Statistics Types
export interface HostStats {
  totalRequests: number;
  completedRequests: number;
  totalSpent: number;
  averageRating?: number;
}

export interface AgentStats {
  totalRequests: number;
  completedRequests: number;
  totalEarned: number;
  averageRating?: number;
} 