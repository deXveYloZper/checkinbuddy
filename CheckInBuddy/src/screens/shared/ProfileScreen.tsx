import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  Icon,
  Center,
  Spinner,
  Alert,
  Input,
  FormControl,
  Avatar,
  Divider,
  Switch,
  Pressable,
  ScrollView,
  Badge,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import apiService from '../../services/api';
import firebaseService from '../../services/firebase';
import { User, UserRole } from '../../types';
import type { AppStackNavigationProp } from '../../types';

export default function ProfileScreen() {
  const navigation = useNavigation<AppStackNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setError(null);
      const userProfile = await apiService.getProfile();
      setUser(userProfile);
      setFormData({
        name: userProfile.name,
        phone: userProfile.phone,
      });
    } catch (err: any) {
      console.error('Fetch profile error:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    setError(null);

    try {
      const updatedUser = await apiService.updateProfile(formData);
      setUser(updatedUser);
      setEditMode(false);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone,
      });
    }
    setError(null);
  };

  const handleSignOut = async () => {
    try {
      await firebaseService.signOut();
      // Navigation will be handled by the auth state change listener
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out');
    }
  };

  const handleNotificationSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  const getRoleDisplayName = (role: UserRole) => {
    return role === UserRole.HOST ? 'Host' : 'Agent';
  };

  const getRoleColor = (role: UserRole) => {
    return role === UserRole.HOST ? 'primary' : 'green';
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'green';
      case 'pending':
        return 'orange';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getVerificationText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Box flex={1} bg="gray.50">
        <Center flex={1}>
          <Spinner size="lg" color="primary.500" />
          <Text mt={4} color="gray.600">Loading profile...</Text>
        </Center>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box flex={1} bg="gray.50">
        <Center flex={1} p={6}>
          <Icon as={MaterialIcons} name="error" size={16} color="red.500" mb={4} />
          <Heading size="md" color="red.600" textAlign="center" mb={2}>
            Profile Not Found
          </Heading>
          <Text color="gray.600" textAlign="center" mb={6}>
            Unable to load your profile information.
          </Text>
          <Button onPress={fetchUserProfile} variant="outline">
            Retry
          </Button>
        </Center>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="gray.50">
      {/* Header */}
      <Box bg="primary.500" pt={12} pb={6} px={4}>
        <VStack space={4} alignItems="center">
          {/* Avatar and Basic Info */}
          <Avatar bg={getRoleColor(user.role) + '.600'} size="xl">
            <Icon as={MaterialIcons} name="person" color="white" size="xl" />
          </Avatar>
          
          <VStack alignItems="center" space={1}>
            <Heading color="white" size="lg" textAlign="center">
              {user.name}
            </Heading>
            <Text color="white" opacity={0.8} fontSize="md">
              {user.email}
            </Text>
            <HStack space={2} alignItems="center">
              <Badge
                colorScheme={getRoleColor(user.role)}
                variant="solid"
              >
                {getRoleDisplayName(user.role)}
              </Badge>
              <Badge
                colorScheme={getVerificationColor(user.verificationStatus)}
                variant="solid"
              >
                {getVerificationText(user.verificationStatus)}
              </Badge>
            </HStack>
          </VStack>
        </VStack>
      </Box>

      <ScrollView flex={1} contentContainerStyle={{ paddingBottom: 100 }}>
        <VStack space={4} p={4}>
          {/* Error Display */}
          {error && (
            <Alert status="error" borderRadius="lg">
              <Alert.Icon />
              <Text color="error.600">{error}</Text>
            </Alert>
          )}

          {/* Personal Information */}
          <Card>
            <VStack space={4} p={4}>
              <HStack justifyContent="space-between" alignItems="center">
                <Heading size="md" color="gray.800">
                  Personal Information
                </Heading>
                {!editMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => setEditMode(true)}
                    leftIcon={<Icon as={MaterialIcons} name="edit" size="xs" />}
                  >
                    Edit
                  </Button>
                )}
              </HStack>

              {editMode ? (
                <VStack space={4}>
                  <FormControl>
                    <FormControl.Label>Full Name</FormControl.Label>
                    <Input
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                      placeholder="Enter your full name"
                    />
                  </FormControl>

                  <FormControl>
                    <FormControl.Label>Phone Number</FormControl.Label>
                    <Input
                      value={formData.phone}
                      onChangeText={(text) => setFormData({ ...formData, phone: text })}
                      placeholder="Enter your phone number"
                      keyboardType="phone-pad"
                    />
                  </FormControl>

                  <HStack space={3}>
                    <Button
                      flex={1}
                      onPress={handleUpdateProfile}
                      isLoading={saving}
                      isLoadingText="Saving..."
                      colorScheme="primary"
                    >
                      Save Changes
                    </Button>
                    <Button
                      flex={1}
                      onPress={handleCancelEdit}
                      variant="outline"
                      colorScheme="gray"
                    >
                      Cancel
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <VStack space={3}>
                  <HStack justifyContent="space-between">
                    <Text color="gray.600">Name:</Text>
                    <Text fontWeight="medium">{user.name}</Text>
                  </HStack>
                  
                  <HStack justifyContent="space-between">
                    <Text color="gray.600">Email:</Text>
                    <Text fontWeight="medium">{user.email}</Text>
                  </HStack>
                  
                  <HStack justifyContent="space-between">
                    <Text color="gray.600">Phone:</Text>
                    <Text fontWeight="medium">{user.phone}</Text>
                  </HStack>
                  
                  <HStack justifyContent="space-between">
                    <Text color="gray.600">Role:</Text>
                    <Text fontWeight="medium">{getRoleDisplayName(user.role)}</Text>
                  </HStack>
                  
                  <HStack justifyContent="space-between">
                    <Text color="gray.600">Member Since:</Text>
                    <Text fontWeight="medium">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </HStack>
                </VStack>
              )}
            </VStack>
          </Card>

          {/* Account Settings */}
          <Card>
            <VStack space={4} p={4}>
              <Heading size="md" color="gray.800">
                Settings
              </Heading>

              <VStack space={3}>
                <Pressable onPress={handleNotificationSettings}>
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack space={3} alignItems="center">
                      <Icon as={MaterialIcons} name="notifications" color="gray.500" size="sm" />
                      <Text>Notification Settings</Text>
                    </HStack>
                    <Icon as={MaterialIcons} name="chevron-right" color="gray.400" size="sm" />
                  </HStack>
                </Pressable>

                <Divider />

                <HStack justifyContent="space-between" alignItems="center">
                  <HStack space={3} alignItems="center">
                    <Icon as={MaterialIcons} name="help" color="gray.500" size="sm" />
                    <Text>Help & Support</Text>
                  </HStack>
                  <Icon as={MaterialIcons} name="chevron-right" color="gray.400" size="sm" />
                </HStack>

                <Divider />

                <HStack justifyContent="space-between" alignItems="center">
                  <HStack space={3} alignItems="center">
                    <Icon as={MaterialIcons} name="privacy-tip" color="gray.500" size="sm" />
                    <Text>Privacy Policy</Text>
                  </HStack>
                  <Icon as={MaterialIcons} name="chevron-right" color="gray.400" size="sm" />
                </HStack>

                <Divider />

                <HStack justifyContent="space-between" alignItems="center">
                  <HStack space={3} alignItems="center">
                    <Icon as={MaterialIcons} name="description" color="gray.500" size="sm" />
                    <Text>Terms of Service</Text>
                  </HStack>
                  <Icon as={MaterialIcons} name="chevron-right" color="gray.400" size="sm" />
                </HStack>
              </VStack>
            </VStack>
          </Card>

          {/* App Information */}
          <Card>
            <VStack space={4} p={4}>
              <Heading size="md" color="gray.800">
                App Information
              </Heading>

              <VStack space={3}>
                <HStack justifyContent="space-between">
                  <Text color="gray.600">Version:</Text>
                  <Text fontWeight="medium">1.0.0 (MVP)</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text color="gray.600">Build:</Text>
                  <Text fontWeight="medium">Development</Text>
                </HStack>
              </VStack>
            </VStack>
          </Card>

          {/* Sign Out */}
          <Card>
            <VStack p={4}>
              <Button
                onPress={handleSignOut}
                colorScheme="red"
                variant="outline"
                leftIcon={<Icon as={MaterialIcons} name="logout" />}
              >
                Sign Out
              </Button>
            </VStack>
          </Card>
        </VStack>
      </ScrollView>
    </Box>
  );
}
