import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
  Radio,
  Divider,
} from 'native-base';
import { Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList, SignupForm, UserRole } from '../../types';
import firebaseService from '../../services/firebase';
import apiService from '../../services/api';

type SignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Signup'>;

interface Props {
  navigation: SignupScreenNavigationProp;
}

export default function SignupScreen({ navigation }: Props) {
  const [formData, setFormData] = useState<SignupForm>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    role: UserRole.HOST,
  });
  const [errors, setErrors] = useState<Partial<SignupForm>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<SignupForm> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setAlertMessage(null);

    try {
      // Create Firebase user
      const firebaseUser = await firebaseService.signUp(formData.email, formData.password);
      
      // Get Firebase ID token
      const firebaseToken = await firebaseUser.getIdToken();
      
      // Register with backend
      await apiService.signup({
        firebaseUid: firebaseUser.uid,
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
      });

      // Auto-login after successful signup
      await apiService.login(firebaseToken);
      
      // Navigation will be handled by the auth state change listener
    } catch (error: any) {
      setAlertMessage(error.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      flex={1}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        flex={1}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Box flex={1} bg="gray.50" px={4} py={8}>
          <VStack flex={1} justifyContent="center" space={6}>
            {/* Header */}
            <VStack space={2} alignItems="center">
              <Heading size="xl" color="primary.600">
                Join CheckInBuddy
              </Heading>
              <Text color="gray.600" textAlign="center">
                Create your account to get started
              </Text>
            </VStack>

            {/* Alert */}
            {alertMessage && (
              <Alert status="error" borderRadius="lg">
                <Alert.Icon />
                <Text color="error.600" fontWeight="semibold">Error</Text>
                <Text color="error.600">{alertMessage}</Text>
              </Alert>
            )}

            {/* Signup Form */}
            <VStack space={4} bg="white" p={6} borderRadius="xl" shadow={2}>
              {/* Role Selection */}
              <FormControl>
                <FormControl.Label>I am a:</FormControl.Label>
                <Radio.Group
                  name="role"
                  value={formData.role}
                  onChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <HStack space={6}>
                    <Radio value={UserRole.HOST} colorScheme="primary">
                      <Text ml={2}>Host</Text>
                    </Radio>
                    <Radio value={UserRole.AGENT} colorScheme="primary">
                      <Text ml={2}>Agent</Text>
                    </Radio>
                  </HStack>
                </Radio.Group>
              </FormControl>

              <Divider />

              <FormControl isInvalid={'name' in errors}>
                <FormControl.Label>Full Name</FormControl.Label>
                <Input
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <FormControl.ErrorMessage>
                  {errors.name}
                </FormControl.ErrorMessage>
              </FormControl>

              <FormControl isInvalid={'email' in errors}>
                <FormControl.Label>Email</FormControl.Label>
                <Input
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <FormControl.ErrorMessage>
                  {errors.email}
                </FormControl.ErrorMessage>
              </FormControl>

              <FormControl isInvalid={'phone' in errors}>
                <FormControl.Label>Phone Number</FormControl.Label>
                <Input
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                />
                <FormControl.ErrorMessage>
                  {errors.phone}
                </FormControl.ErrorMessage>
              </FormControl>

              <FormControl isInvalid={'password' in errors}>
                <FormControl.Label>Password</FormControl.Label>
                <Input
                  placeholder="Create a password"
                  type="password"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <FormControl.ErrorMessage>
                  {errors.password}
                </FormControl.ErrorMessage>
              </FormControl>

              <FormControl isInvalid={'confirmPassword' in errors}>
                <FormControl.Label>Confirm Password</FormControl.Label>
                <Input
                  placeholder="Confirm your password"
                  type="password"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <FormControl.ErrorMessage>
                  {errors.confirmPassword}
                </FormControl.ErrorMessage>
              </FormControl>

              <Button
                onPress={handleSignup}
                isLoading={isLoading}
                isLoadingText="Creating account..."
                colorScheme="primary"
                size="lg"
                mt={2}
              >
                Create Account
              </Button>
            </VStack>

            {/* Login Link */}
            <HStack justifyContent="center" space={2}>
              <Text color="gray.600">Already have an account?</Text>
              <Pressable onPress={handleLogin}>
                <Text color="primary.600" fontWeight="semibold">
                  Sign In
                </Text>
              </Pressable>
            </HStack>
          </VStack>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
