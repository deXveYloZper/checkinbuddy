// App.tsx
/* -------------------------------------------------------------------------- */
/* Root component — wraps navigation in NativeBaseProvider so useTheme works  */
/* -------------------------------------------------------------------------- */
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { NativeBaseProvider, extendTheme } from 'native-base';
import Navigation from './src/navigation';

/* Optional: customise your colour palette once, reuse everywhere */
const theme = extendTheme({
  colors: {
    primary: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3',
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
    },
    secondary: {
      50: '#f3e5f5',
      100: '#e1bee7',
      200: '#ce93d8',
      300: '#ba68c8',
      400: '#ab47bc',
      500: '#9c27b0',
      600: '#8e24aa',
      700: '#7b1fa2',
      800: '#6a1b9a',
      900: '#4a148c',
    },
  },
});

export default function App() {
  /* ------------------------------------------------------------ *
   *  Notifications placeholder (kept from your original file)    *
   * ------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      console.log('Notifications temporarily disabled for Expo Go testing');
    })();
  }, []);

  /* ---------------------------- render ---------------------------- */
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NativeBaseProvider theme={theme}>
        <StatusBar style="auto" />
        <Navigation />
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
}
