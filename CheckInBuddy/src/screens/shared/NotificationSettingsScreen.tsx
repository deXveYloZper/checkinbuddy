import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Switch,
  Button,
  Alert,
  Icon,
  Pressable,
  ScrollView,
  Badge,
  useTheme,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import notificationService, { NotificationPermissions } from '../../services/notification';
import type { AppStackNavigationProp } from '../../types';

interface NotificationPreferences {
  requestAccepted: boolean;
  requestCompleted: boolean;
  newRequestsNearby: boolean;
  paymentReceived: boolean;
  appUpdates: boolean;
  marketing: boolean;
}

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<AppStackNavigationProp>();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<NotificationPermissions | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    requestAccepted: true,
    requestCompleted: true,
    newRequestsNearby: true,
    paymentReceived: true,
    appUpdates: true,
    marketing: false,
  });
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    setLoading(true);
    
    try {
      // Check notification permissions
      const enabled = await notificationService.areNotificationsEnabled();
      const perms = await notificationService.requestPermissions();
      setPermissions(perms);

      // Get stored push token
      const token = await notificationService.getStoredPushToken();
      setPushToken(token);

      // TODO: Load user preferences from backend/AsyncStorage
      
    } catch (error) {
      console.error('Load notification settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const perms = await notificationService.requestPermissions();
      setPermissions(perms);
      
      if (perms.granted) {
        await notificationService.registerForPushNotifications();
        const token = await notificationService.getStoredPushToken();
        setPushToken(token);
      }
    } catch (error) {
      console.error('Enable notifications error:', error);
    }
  };

  const handleOpenSettings = async () => {
    await notificationService.openNotificationSettings();
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.sendLocalNotification(
        'Test Notification',
        'This is a test notification from CheckInBuddy',
        { type: 'test' }
      );
    } catch (error) {
      console.error('Test notification error:', error);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
    
    // TODO: Save preferences to backend/AsyncStorage
  };

  const getPermissionStatusColor = () => {
    if (!permissions) return 'gray';
    
    switch (permissions.status) {
      case 'granted':
        return 'green';
      case 'denied':
        return 'red';
      case 'undetermined':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getPermissionStatusText = () => {
    if (!permissions) return 'Checking...';
    
    switch (permissions.status) {
      case 'granted':
        return 'Enabled';
      case 'denied':
        return 'Disabled';
      case 'undetermined':
        return 'Not Set';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Box flex={1} bg="gray.50">
        <Box bg="primary.500" pt={12} pb={4} px={4}>
          <HStack alignItems="center" space={3}>
            <Pressable onPress={() => navigation.goBack()}>
              <Icon as={MaterialIcons} name="arrow-back" size="lg" color="white" />
            </Pressable>
            <Heading color="white" size="lg">
              Notification Settings
            </Heading>
          </HStack>
        </Box>
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text color="gray.600">Loading settings...</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="gray.50">
      {/* Header */}
      <Box bg="primary.500" pt={12} pb={4} px={4}>
        <HStack alignItems="center" space={3}>
          <Pressable onPress={() => navigation.goBack()}>
            <Icon as={MaterialIcons} name="arrow-back" size="lg" color="white" />
          </Pressable>
          <VStack flex={1}>
            <Heading color="white" size="lg">
              Notification Settings
            </Heading>
            <Text color="white" opacity={0.9} fontSize="sm">
              Manage your notification preferences
            </Text>
          </VStack>
        </HStack>
      </Box>

      <ScrollView flex={1}>
        <VStack space={6} p={4}>
          {/* Permission Status */}
          <Box bg="white" rounded="lg" p={4} shadow={1}>
            <VStack space={4}>
              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex={1}>
                  <Text fontWeight="bold" color="gray.800">
                    Push Notifications
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Allow CheckInBuddy to send you push notifications
                  </Text>
                </VStack>
                <Badge colorScheme={getPermissionStatusColor()} rounded="md">
                  {getPermissionStatusText()}
                </Badge>
              </HStack>

              {!permissions?.granted && (
                <VStack space={3}>
                  {permissions?.canAskAgain ? (
                    <Button
                      onPress={handleEnableNotifications}
                      bg="primary.500"
                      size="sm"
                    >
                      Enable Notifications
                    </Button>
                  ) : (
                    <VStack space={2}>
                      <Alert status="warning">
                        <Alert.Icon />
                        <Text fontSize="sm">
                          Notifications are disabled. Please enable them in your device settings.
                        </Text>
                      </Alert>
                      <Button
                        onPress={handleOpenSettings}
                        variant="outline"
                        size="sm"
                      >
                        Open Settings
                      </Button>
                    </VStack>
                  )}
                </VStack>
              )}

              {permissions?.granted && pushToken && (
                <VStack space={2}>
                  <HStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="check-circle" size="sm" color="green.500" />
                    <Text fontSize="sm" color="green.600">
                      Notifications are enabled
                    </Text>
                  </HStack>
                  <Button
                    onPress={handleTestNotification}
                    variant="outline"
                    size="sm"
                  >
                    Send Test Notification
                  </Button>
                </VStack>
              )}
            </VStack>
          </Box>

          {/* Notification Preferences */}
          {permissions?.granted && (
            <Box bg="white" rounded="lg" p={4} shadow={1}>
              <VStack space={4}>
                <Heading size="sm" color="gray.800">
                  Notification Types
                </Heading>

                <VStack space={3}>
                  {/* Request Notifications */}
                  <VStack space={3}>
                    <Text fontWeight="medium" color="gray.700">
                      Check-in Requests
                    </Text>
                    
                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack flex={1}>
                        <Text color="gray.800">Request Accepted</Text>
                        <Text fontSize="xs" color="gray.500">
                          When an agent accepts your request
                        </Text>
                      </VStack>
                      <Switch
                        value={preferences.requestAccepted}
                        onValueChange={(value) => handlePreferenceChange('requestAccepted', value)}
                        colorScheme="primary"
                      />
                    </HStack>

                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack flex={1}>
                        <Text color="gray.800">Request Completed</Text>
                        <Text fontSize="xs" color="gray.500">
                          When a check-in is completed
                        </Text>
                      </VStack>
                      <Switch
                        value={preferences.requestCompleted}
                        onValueChange={(value) => handlePreferenceChange('requestCompleted', value)}
                        colorScheme="primary"
                      />
                    </HStack>

                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack flex={1}>
                        <Text color="gray.800">New Requests Nearby</Text>
                        <Text fontSize="xs" color="gray.500">
                          When new requests are available near you
                        </Text>
                      </VStack>
                      <Switch
                        value={preferences.newRequestsNearby}
                        onValueChange={(value) => handlePreferenceChange('newRequestsNearby', value)}
                        colorScheme="primary"
                      />
                    </HStack>
                  </VStack>

                  {/* Payment Notifications */}
                  <VStack space={3}>
                    <Text fontWeight="medium" color="gray.700">
                      Payments
                    </Text>
                    
                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack flex={1}>
                        <Text color="gray.800">Payment Received</Text>
                        <Text fontSize="xs" color="gray.500">
                          When you receive payment for completed work
                        </Text>
                      </VStack>
                      <Switch
                        value={preferences.paymentReceived}
                        onValueChange={(value) => handlePreferenceChange('paymentReceived', value)}
                        colorScheme="primary"
                      />
                    </HStack>
                  </VStack>

                  {/* App Notifications */}
                  <VStack space={3}>
                    <Text fontWeight="medium" color="gray.700">
                      App Updates
                    </Text>
                    
                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack flex={1}>
                        <Text color="gray.800">App Updates</Text>
                        <Text fontSize="xs" color="gray.500">
                          Important app updates and feature announcements
                        </Text>
                      </VStack>
                      <Switch
                        value={preferences.appUpdates}
                        onValueChange={(value) => handlePreferenceChange('appUpdates', value)}
                        colorScheme="primary"
                      />
                    </HStack>

                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack flex={1}>
                        <Text color="gray.800">Marketing</Text>
                        <Text fontSize="xs" color="gray.500">
                          Special offers and promotional content
                        </Text>
                      </VStack>
                      <Switch
                        value={preferences.marketing}
                        onValueChange={(value) => handlePreferenceChange('marketing', value)}
                        colorScheme="primary"
                      />
                    </HStack>
                  </VStack>
                </VStack>
              </VStack>
            </Box>
          )}

          {/* Debug Info (only in development) */}
          {__DEV__ && pushToken && (
            <Box bg="yellow.50" rounded="lg" p={4} borderWidth={1} borderColor="yellow.200">
              <VStack space={2}>
                <Text fontWeight="bold" color="yellow.800">
                  Debug Info
                </Text>
                <Text fontSize="xs" color="yellow.700">
                  Push Token: {pushToken.substring(0, 50)}...
                </Text>
                <Text fontSize="xs" color="yellow.700">
                  Status: {permissions?.status}
                </Text>
              </VStack>
            </Box>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
} 