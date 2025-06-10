import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import our navigation (without theme for now)
import Navigation from './src/navigation';

export default function App() {
  useEffect(() => {
    // TODO: Re-enable notifications after fixing the project ID issue
    // Initialize notifications when app starts
    const initializeNotifications = async () => {
      try {
        console.log('Notifications temporarily disabled for Expo Go testing');
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Navigation />
    </SafeAreaProvider>
  );
}
