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
} from 'native-base';
import { Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList, LoginForm } from '../../types';
import firebaseService from '../../services/firebase';
import apiService from '../../services/api';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setAlertMessage(null);

    try {
      // Sign in with Firebase
      const firebaseUser = await firebaseService.signIn(formData.email, formData.password);
      
      // Get Firebase ID token
      const firebaseToken = await firebaseUser.getIdToken();
      
      // Login to backend and get app token
      await apiService.login(firebaseToken);
      
      // Navigation will be handled by the auth state change listener
    } catch (error: any) {
      setAlertMessage(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignUp = () => {
    navigation.navigate('Signup');
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
                CheckInBuddy
              </Heading>
              <Text color="gray.600" textAlign="center">
                Welcome back! Sign in to your account
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

            {/* Login Form */}
            <VStack space={4} bg="white" p={6} borderRadius="xl" shadow={2}>
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

              <FormControl isInvalid={'password' in errors}>
                <FormControl.Label>Password</FormControl.Label>
                <Input
                  placeholder="Enter your password"
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

              <Button
                onPress={handleLogin}
                isLoading={isLoading}
                isLoadingText="Signing in..."
                colorScheme="primary"
                size="lg"
                mt={2}
              >
                Sign In
              </Button>

              <Pressable onPress={handleForgotPassword}>
                <Text textAlign="center" color="primary.600" fontSize="sm">
                  Forgot your password?
                </Text>
              </Pressable>
            </VStack>

            {/* Sign Up Link */}
            <HStack justifyContent="center" space={2}>
              <Text color="gray.600">Don't have an account?</Text>
              <Pressable onPress={handleSignUp}>
                <Text color="primary.600" fontWeight="semibold">
                  Sign Up
                </Text>
              </Pressable>
            </HStack>
          </VStack>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
