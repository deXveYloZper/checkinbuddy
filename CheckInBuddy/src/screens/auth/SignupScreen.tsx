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
  const [touched, setTouched] = useState<Partial<SignupForm>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<SignupForm> = {};

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    setTouched({ email: true, password: true, confirmPassword: true, name: true, phone: true });
    if (!validateForm()) return;

    setIsLoading(true);
    setAlertMessage(null);

    try {
      // Create user in Firebase
      const firebaseUser = await firebaseService.signUp(formData.email, formData.password);
      console.log('Firebase user created:', firebaseUser);
      
      // Get Firebase ID token
      const firebaseToken = await firebaseUser.getIdToken();
      console.log('Firebase token:', firebaseToken);
      
      // Sign up in backend
      const response = await apiService.signup(firebaseToken, formData.role, formData.name);
      console.log('Backend response:', response);
      
      // Navigation will be handled by the auth state change listener
    } catch (error: any) {
      console.error('Signup error:', error);
      setAlertMessage(error.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleBlur = (field: keyof SignupForm) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateForm();
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
                Create Account
              </Heading>
              <Text color="gray.600" textAlign="center">
                Sign up to get started with CheckInBuddy
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
              <FormControl isInvalid={!!(touched.email && errors.email)}>
                <FormControl.Label>Email</FormControl.Label>
                <Input
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  onBlur={() => handleBlur('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <FormControl.ErrorMessage>
                  {errors.email}
                </FormControl.ErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!(touched.name && errors.name)}>
                <FormControl.Label>Name</FormControl.Label>
                <Input
                  placeholder="Enter your name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  onBlur={() => handleBlur('name')}
                  autoCapitalize="words"
                />
                <FormControl.ErrorMessage>
                  {errors.name}
                </FormControl.ErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!(touched.phone && errors.phone)}>
                <FormControl.Label>Phone</FormControl.Label>
                <Input
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  onBlur={() => handleBlur('phone')}
                  keyboardType="phone-pad"
                />
                <FormControl.ErrorMessage>
                  {errors.phone}
                </FormControl.ErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!(touched.password && errors.password)}>
                <FormControl.Label>Password</FormControl.Label>
                <Input
                  placeholder="Create a password"
                  type="password"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  onBlur={() => handleBlur('password')}
                  autoCapitalize="none"
                />
                <FormControl.ErrorMessage>
                  {errors.password}
                </FormControl.ErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!(touched.confirmPassword && errors.confirmPassword)}>
                <FormControl.Label>Confirm Password</FormControl.Label>
                <Input
                  placeholder="Confirm your password"
                  type="password"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  onBlur={() => handleBlur('confirmPassword')}
                  autoCapitalize="none"
                />
                <FormControl.ErrorMessage>
                  {errors.confirmPassword}
                </FormControl.ErrorMessage>
              </FormControl>

              <FormControl>
                <FormControl.Label>I am a:</FormControl.Label>
                <Radio.Group
                  name="role"
                  value={formData.role}
                  onChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <HStack space={4}>
                    <Radio value={UserRole.HOST} colorScheme="primary">
                      <Text ml={2}>Host</Text>
                    </Radio>
                    <Radio value={UserRole.AGENT} colorScheme="primary">
                      <Text ml={2}>Agent</Text>
                    </Radio>
                  </HStack>
                </Radio.Group>
                <FormControl.HelperText>
                  Hosts create check-in requests, Agents fulfill them
                </FormControl.HelperText>
              </FormControl>

              <Button
                mt={4}
                onPress={handleSignup}
                isLoading={isLoading}
                isLoadingText="Creating account..."
              >
                Sign Up
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
