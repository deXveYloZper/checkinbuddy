import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import Types
import { 
  RootStackParamList, 
  AuthStackParamList, 
  AppStackParamList,
  HostTabParamList,
  AgentTabParamList,
  UserRole 
} from '../types';

// Import Services
import firebaseService from '../services/firebase';
import apiService from '../services/api';

// Import Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Host Screens
import HostDashboardScreen from '../screens/host/DashboardScreen';
import HostRequestsScreen from '../screens/host/RequestsScreen';
import CreateRequestScreen from '../screens/host/CreateRequestScreen';

// Agent Screens
import AgentMapScreen from '../screens/agent/MapScreen';
import AgentRequestsScreen from '../screens/agent/RequestsScreen';

// Shared Screens
import ProfileScreen from '../screens/shared/ProfileScreen';

// Create navigators
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const AppStack = createStackNavigator<AppStackParamList>();
const HostTab = createBottomTabNavigator<HostTabParamList>();
const AgentTab = createBottomTabNavigator<AgentTabParamList>();

// Auth Stack Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// Host Tab Navigator
function HostTabNavigator() {
  return (
    <HostTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Requests') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <HostTab.Screen 
        name="Dashboard" 
        component={HostDashboardScreen} 
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <HostTab.Screen 
        name="Requests" 
        component={HostRequestsScreen} 
        options={{ tabBarLabel: 'My Requests' }}
      />
      <HostTab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Profile' }}
      />
    </HostTab.Navigator>
  );
}

// Agent Tab Navigator
function AgentTabNavigator() {
  return (
    <AgentTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'MyRequests') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <AgentTab.Screen 
        name="Map" 
        component={AgentMapScreen} 
        options={{ tabBarLabel: 'Find Requests' }}
      />
      <AgentTab.Screen 
        name="MyRequests" 
        component={AgentRequestsScreen} 
        options={{ tabBarLabel: 'My Requests' }}
      />
      <AgentTab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Profile' }}
      />
    </AgentTab.Navigator>
  );
}

// App Stack Navigator
function AppNavigator({ userRole }: { userRole: UserRole }) {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      {userRole === UserRole.HOST ? (
        <>
          <AppStack.Screen name="HostTabs" component={HostTabNavigator} />
          <AppStack.Screen name="CreateRequest" component={CreateRequestScreen} />
        </>
      ) : (
        <AppStack.Screen name="AgentTabs" component={AgentTabNavigator} />
      )}
    </AppStack.Navigator>
  );
}

// Main Navigation Component
export default function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = firebaseService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // User is signed in, get Firebase token and login to backend
          const firebaseToken = await firebaseUser.getIdToken();
          const response = await apiService.login(firebaseToken);
          
          setIsAuthenticated(true);
          setUserRole(response.user.role);
        } catch (error) {
          console.error('Failed to authenticate with backend:', error);
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } else {
        // User is signed out
        setIsAuthenticated(false);
        setUserRole(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Show loading screen while checking auth state
  if (isLoading || isAuthenticated === null) {
    const LoadingScreen = () => {
      return (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#f0f8ff' 
        }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0ea5e9', marginBottom: 20 }}>
            🏠 CheckInBuddy
          </Text>
          <Text style={{ fontSize: 16, color: '#6b7280' }}>Loading...</Text>
        </View>
      );
    };

    return (
      <NavigationContainer>
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoadingScreen} />
        </AuthStack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated && userRole ? (
          <RootStack.Screen name="App">
            {() => <AppNavigator userRole={userRole} />}
          </RootStack.Screen>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
