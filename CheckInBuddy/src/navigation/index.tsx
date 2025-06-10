import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, Button } from 'react-native';

// Simple placeholder screen
function SimpleLoginScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0ea5e9', marginBottom: 20 }}>
        🏠 CheckInBuddy
      </Text>
      <Text style={{ fontSize: 18, color: '#059669', marginBottom: 20, textAlign: 'center' }}>
        Welcome to CheckInBuddy - Your Airbnb Check-in Solution
      </Text>
      <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 30, textAlign: 'center' }}>
        Full app navigation is loading...
      </Text>
      <Button title="Login (Demo)" onPress={() => console.log('Login pressed')} />
    </View>
  );
}

const Stack = createStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={SimpleLoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
