import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NativeBaseProvider } from 'native-base';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import our custom theme and navigation
import theme from './src/theme';
import Navigation from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <NativeBaseProvider theme={theme}>
        <StatusBar style="auto" />
        <Navigation />
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
}
