import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
}

class NotificationService {
  private notificationListener: any;
  private responseListener: any;

  // Initialize notification service
  async initialize(): Promise<NotificationPermissions> {
    try {
      const permissions = await this.requestPermissions();
      
      if (permissions.granted) {
        await this.registerForPushNotifications();
        this.setupNotificationListeners();
      }

      return permissions;
    } catch (error) {
      console.error('Notification initialization error:', error);
      throw error;
    }
  }

  // Request notification permissions
  async requestPermissions(): Promise<NotificationPermissions> {
    try {
      let finalStatus = await Notifications.getPermissionsAsync();
      
      if (!finalStatus.granted && finalStatus.canAskAgain) {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = { ...finalStatus, status };
      }

      // For Android, ensure we can post notifications
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'CheckInBuddy Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: true,
        });
      }

      return {
        granted: finalStatus.granted,
        canAskAgain: finalStatus.canAskAgain,
        status: finalStatus.status,
      };
    } catch (error) {
      console.error('Request permissions error:', error);
      throw error;
    }
  }

  // Register device for push notifications
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Get the token that uniquely identifies this device
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your actual Expo project ID
      });

      console.log('Push notification token:', token.data);

      // Store token locally
      await AsyncStorage.setItem('expoPushToken', token.data);

      // Send token to backend for storage
      try {
        await apiService.registerPushToken(token.data);
      } catch (error) {
        console.warn('Failed to register push token with backend:', error);
        // Continue anyway - token is stored locally
      }

      return token.data;
    } catch (error) {
      console.error('Register push notifications error:', error);
      return null;
    }
  }

  // Setup notification event listeners
  setupNotificationListeners(): void {
    // Listener for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  // Handle notification received while app is in foreground
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { title, body, data } = notification.request.content;
    
    // You can add custom handling here, such as:
    // - Update app state
    // - Show in-app notification
    // - Play custom sound
    // - Update badge count
    
    console.log('Processing notification:', { title, body, data });
  }

  // Handle notification tap/response
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { notification } = response;
    const { data } = notification.request.content;

    // Handle navigation based on notification data
    if (data && data.type) {
      this.handleNotificationNavigation(data);
    }
  }

  // Navigate based on notification data
  private handleNotificationNavigation(data: any): void {
    try {
      switch (data.type) {
        case 'request_accepted':
          // Navigate to request details
          if (data.requestId) {
            // Note: You'll need to pass navigation reference to use this
            console.log('Navigate to request details:', data.requestId);
          }
          break;
        
        case 'request_completed':
          // Navigate to completed request
          if (data.requestId) {
            console.log('Navigate to completed request:', data.requestId);
          }
          break;
        
        case 'new_request':
          // Navigate to map or requests list
          console.log('Navigate to new request notification');
          break;
        
        case 'payment_received':
          // Navigate to payment/earnings screen
          console.log('Navigate to payment notification');
          break;
        
        default:
          console.log('Unknown notification type:', data.type);
      }
    } catch (error) {
      console.error('Notification navigation error:', error);
    }
  }

  // Send local notification (for testing)
  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Send local notification error:', error);
      throw error;
    }
  }

  // Get stored push token
  async getStoredPushToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('expoPushToken');
    } catch (error) {
      console.error('Get stored push token error:', error);
      return null;
    }
  }

  // Clear notification badge
  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Clear badge error:', error);
    }
  }

  // Get notification history
  async getNotificationHistory(): Promise<Notifications.Notification[]> {
    try {
      return await Notifications.getPresentedNotificationsAsync();
    } catch (error) {
      console.error('Get notification history error:', error);
      return [];
    }
  }

  // Cleanup listeners
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      return permissions.granted;
    } catch (error) {
      console.error('Check notifications enabled error:', error);
      return false;
    }
  }

  // Open device notification settings
  async openNotificationSettings(): Promise<void> {
    try {
      await Notifications.openSettingsAsync();
    } catch (error) {
      console.error('Open notification settings error:', error);
    }
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();
export default notificationService; 