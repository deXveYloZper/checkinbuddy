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
  Icon,
} from 'native-base';
import { Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types';
import firebaseService from '../../services/firebase';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

interface Props {
  navigation: ForgotPasswordScreenNavigationProp;
}

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail(email)) return;

    setIsLoading(true);
    setError(null);

    try {
      await firebaseService.sendPasswordReset(email);
      setSuccess(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later');
      } else {
        setError(error.message || 'Failed to send password reset email');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  if (success) {
    return (
      <KeyboardAvoidingView
        flex={1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Box flex={1} bg="gray.50" px={4} py={8}>
          <VStack flex={1} justifyContent="center" space={6}>
            {/* Header */}
            <VStack space={2} alignItems="center">
              <Icon 
                as={MaterialIcons} 
                name="mark-email-read" 
                size={16} 
                color="green.500" 
                mb={4} 
              />
              <Heading size="xl" color="green.600" textAlign="center">
                Check Your Email
              </Heading>
              <Text color="gray.600" textAlign="center">
                We've sent password reset instructions to
              </Text>
              <Text color="primary.600" fontWeight="semibold" textAlign="center">
                {email}
              </Text>
            </VStack>

            {/* Instructions */}
            <VStack space={4} bg="white" p={6} borderRadius="xl" shadow={2}>
              <VStack space={3}>
                <Text color="gray.700" textAlign="center">
                  Follow the instructions in the email to reset your password.
                </Text>
                
                <Text color="gray.600" fontSize="sm" textAlign="center">
                  If you don't see the email, check your spam folder or try again with a different email address.
                </Text>
              </VStack>

              <Button
                onPress={handleBackToLogin}
                colorScheme="primary"
                size="lg"
                mt={4}
              >
                Back to Sign In
              </Button>

              <Button
                onPress={() => setSuccess(false)}
                variant="ghost"
                colorScheme="gray"
                size="lg"
              >
                Try Different Email
              </Button>
            </VStack>
          </VStack>
        </Box>
      </KeyboardAvoidingView>
    );
  }

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
            {/* Header with Back Button */}
            <VStack space={4}>
              <HStack alignItems="center" space={3}>
                <Pressable onPress={handleBack}>
                  <Icon as={MaterialIcons} name="arrow-back" size="lg" color="gray.600" />
                </Pressable>
                <Heading size="lg" color="gray.800" flex={1}>
                  Reset Password
                </Heading>
              </HStack>

              <VStack space={2} alignItems="center">
                <Icon 
                  as={MaterialIcons} 
                  name="lock-reset" 
                  size={12} 
                  color="primary.500" 
                  mb={2} 
                />
                <Heading size="xl" color="primary.600" textAlign="center">
                  Forgot Your Password?
                </Heading>
                <Text color="gray.600" textAlign="center">
                  No worries! Enter your email address and we'll send you instructions to reset your password.
                </Text>
              </VStack>
            </VStack>

            {/* Alert */}
            {error && (
              <Alert status="error" borderRadius="lg">
                <Alert.Icon />
                <Text color="error.600" fontWeight="semibold">Error</Text>
                <Text color="error.600">{error}</Text>
              </Alert>
            )}

            {/* Reset Form */}
            <VStack space={4} bg="white" p={6} borderRadius="xl" shadow={2}>
              <FormControl>
                <FormControl.Label>Email Address</FormControl.Label>
                <Input
                  placeholder="Enter your email address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  InputLeftElement={
                    <Icon 
                      as={MaterialIcons} 
                      name="email" 
                      size="sm" 
                      ml={3} 
                      color="gray.400" 
                    />
                  }
                />
              </FormControl>

              <Button
                onPress={handleResetPassword}
                isLoading={isLoading}
                isLoadingText="Sending..."
                colorScheme="primary"
                size="lg"
                mt={2}
              >
                Send Reset Instructions
              </Button>
            </VStack>

            {/* Back to Login Link */}
            <HStack justifyContent="center" space={2}>
              <Text color="gray.600">Remember your password?</Text>
              <Pressable onPress={handleBackToLogin}>
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
