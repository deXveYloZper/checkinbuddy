import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NativeBaseProvider } from 'native-base';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import our custom theme and navigation
import theme from './src/theme';
import Navigation from './src/navigation';
import notificationService from './src/services/notification';

export default function App() {
  useEffect(() => {
    // Initialize notifications when app starts
    const initializeNotifications = async () => {
      try {
        const permissions = await notificationService.initialize();
        console.log('Notification permissions:', permissions);
        
        if (permissions.granted) {
          console.log('Notifications initialized successfully');
        } else {
          console.warn('Notification permissions not granted');
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NativeBaseProvider theme={theme}>
        <StatusBar style="auto" />
        <Navigation />
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
}
