// App.tsx
/* -------------------------------------------------------------------------- */
/* Root component — wraps navigation in NativeBaseProvider so useTheme works  */
/* -------------------------------------------------------------------------- */
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NativeBaseProvider, extendTheme } from 'native-base';
import Navigation from './src/navigation';

/* Optional: customise your colour palette once, reuse everywhere */
const theme = extendTheme({
  colors: {
    primary: {
      50:  '#e3f2fd',
      500: '#2196f3',
      700: '#1976d2',
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
    <NativeBaseProvider theme={theme}>    {/* <-- NEW context provider */}
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Navigation />
      </SafeAreaProvider>
    </NativeBaseProvider>
  );
}
