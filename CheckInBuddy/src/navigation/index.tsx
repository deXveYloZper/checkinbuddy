import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { User as FirebaseUser } from 'firebase/auth';

// Import types
import { 
  RootStackParamList, 
  AuthStackParamList, 
  AppStackParamList,
  HostTabParamList,
  AgentTabParamList,
  UserRole 
} from '../types';

// Import services
import firebaseService from '../services/firebase';
import apiService from '../services/api';

// Import screens (we'll create these next)
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Host screens
import HostDashboardScreen from '../screens/host/DashboardScreen';
import HostRequestsScreen from '../screens/host/RequestsScreen';
import CreateRequestScreen from '../screens/host/CreateRequestScreen';

// Agent screens
import AgentMapScreen from '../screens/agent/MapScreen';
import AgentRequestsScreen from '../screens/agent/RequestsScreen';

// Shared screens
import ProfileScreen from '../screens/shared/ProfileScreen';
import RequestDetailsScreen from '../screens/shared/RequestDetailsScreen';
import DocumentUploadScreen from '../screens/shared/DocumentUploadScreen';
import PaymentScreen from '../screens/shared/PaymentScreen';

// Create navigators
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const AppStack = createStackNavigator<AppStackParamList>();
const HostTabs = createBottomTabNavigator<HostTabParamList>();
const AgentTabs = createBottomTabNavigator<AgentTabParamList>();

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f9fafb' },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// Host Tab Navigator
function HostTabNavigator() {
  return (
    <HostTabs.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Requests') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <HostTabs.Screen 
        name="Dashboard" 
        component={HostDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <HostTabs.Screen 
        name="Requests" 
        component={HostRequestsScreen}
        options={{ tabBarLabel: 'My Requests' }}
      />
      <HostTabs.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </HostTabs.Navigator>
  );
}

// Agent Tab Navigator
function AgentTabNavigator() {
  return (
    <AgentTabs.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'MyRequests') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#14b8a6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <AgentTabs.Screen 
        name="Map" 
        component={AgentMapScreen}
        options={{ tabBarLabel: 'Nearby' }}
      />
      <AgentTabs.Screen 
        name="MyRequests" 
        component={AgentRequestsScreen}
        options={{ tabBarLabel: 'My Jobs' }}
      />
      <AgentTabs.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </AgentTabs.Navigator>
  );
}

// App Navigator
function AppNavigator({ userRole }: { userRole: UserRole }) {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {userRole === UserRole.HOST ? (
        <AppStack.Screen name="HostTabs" component={HostTabNavigator} />
      ) : (
        <AppStack.Screen name="AgentTabs" component={AgentTabNavigator} />
      )}
      
      {/* Shared screens */}
      <AppStack.Screen 
        name="CreateRequest" 
        component={CreateRequestScreen}
        options={{ 
          headerShown: true,
          title: 'Create Check-in Request',
          headerStyle: { backgroundColor: '#0ea5e9' },
          headerTintColor: 'white',
        }}
      />
      <AppStack.Screen 
        name="RequestDetails" 
        component={RequestDetailsScreen}
        options={{ 
          headerShown: true,
          title: 'Request Details',
          headerStyle: { backgroundColor: '#0ea5e9' },
          headerTintColor: 'white',
        }}
      />
      <AppStack.Screen 
        name="DocumentUpload" 
        component={DocumentUploadScreen}
        options={{ 
          headerShown: true,
          title: 'Upload Documents',
          headerStyle: { backgroundColor: '#14b8a6' },
          headerTintColor: 'white',
        }}
      />
      <AppStack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ 
          headerShown: true,
          title: 'Payment',
          headerStyle: { backgroundColor: '#0ea5e9' },
          headerTintColor: 'white',
        }}
      />
    </AppStack.Navigator>
  );
}

// Main Navigation Component
export default function Navigation() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get user profile from backend to determine role
          const userProfile = await apiService.getProfile();
          setUserRole(userProfile.role);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // If we can't get profile, sign out
          await firebaseService.signOut();
        }
      } else {
        setUserRole(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    // TODO: Add a proper loading screen
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user && userRole ? (
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
