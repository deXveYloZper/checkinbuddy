import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  FormControl,
  Input,
  TextArea,
  Icon,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  Spinner,
  Center,
  useTheme,
} from 'native-base';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import apiService from '../../services/api';
import { CreateRequestForm, AppStackNavigationProp } from '../../types';

export default function CreateRequestScreen() {
  const navigation = useNavigation<AppStackNavigationProp>();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateRequestForm>({
    propertyAddress: '',
    guestName: '',
    guestCount: 1,
    checkInTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
    specialInstructions: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateRequestForm, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateRequestForm, string>> = {};

    // Property Address validation
    if (!formData.propertyAddress.trim()) {
      newErrors.propertyAddress = 'Property address is required';
    } else if (formData.propertyAddress.trim().length < 10) {
      newErrors.propertyAddress = 'Please provide a complete address';
    }

    // Guest Name validation
    if (!formData.guestName.trim()) {
      newErrors.guestName = 'Guest name is required';
    } else if (formData.guestName.trim().length < 2) {
      newErrors.guestName = 'Guest name must be at least 2 characters';
    }

    // Guest Count validation
    if (formData.guestCount < 1 || formData.guestCount > 20) {
      newErrors.guestCount = 'Guest count must be between 1 and 20';
    }

    // Check-in Time validation
    const now = new Date();
    const checkInTime = new Date(formData.checkInTime);
    if (checkInTime <= now) {
      newErrors.checkInTime = 'Check-in time must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateRequestForm, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDateTime = new Date(formData.checkInTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      handleInputChange('checkInTime', newDateTime);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDateTime = new Date(formData.checkInTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      handleInputChange('checkInTime', newDateTime);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request = await apiService.createCheckInRequest(formData);
      setSuccess(true);
      
      // Navigate to payment screen after successful creation
      setTimeout(() => {
        navigation.navigate('Payment', { requestId: request.id });
      }, 1500);
    } catch (err: any) {
      console.error('Create request error:', err);
      setError(err.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (success) {
    return (
      <Box flex={1} bg="gray.50">
        <Box flex={1} justifyContent="center" alignItems="center" p={6}>
          <Icon
            as={MaterialIcons}
            name="check-circle"
            size={20}
            color="green.500"
            mb={4}
          />
          <Heading size="lg" color="green.600" textAlign="center" mb={2}>
            Request Created!
          </Heading>
          <Text color="gray.600" textAlign="center" mb={4}>
            Your check-in request has been created successfully.
          </Text>
          <Text color="gray.500" fontSize="sm" textAlign="center">
            Redirecting to payment...
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <KeyboardAvoidingView
      flex={1}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      bg="gray.50"
    >
      {/* Header */}
      <Box bg="primary.500" pt={12} pb={4} px={4}>
        <HStack alignItems="center" space={3}>
          <Pressable onPress={handleCancel}>
            <Icon as={MaterialIcons} name="arrow-back" size="lg" color="white" />
          </Pressable>
          <Heading color="white" size="lg" flex={1}>
            Create Request
          </Heading>
        </HStack>
      </Box>

      <ScrollView flex={1} contentContainerStyle={{ paddingBottom: 100 }}>
        <VStack space={6} p={4}>
          {/* Error Alert */}
          {error && (
            <Alert status="error">
              <Alert.Icon />
              <Text>{error}</Text>
            </Alert>
          )}

          {/* Property Address */}
          <FormControl isRequired isInvalid={!!errors.propertyAddress}>
            <FormControl.Label>
              <Text fontWeight="bold" color="gray.700">
                Property Address
              </Text>
            </FormControl.Label>
            <Input
              placeholder="Enter the complete property address where the check-in will take place..."
              value={formData.propertyAddress}
              onChangeText={(value) => handleInputChange('propertyAddress', value)}
              bg="white"
              borderColor="gray.300"
              _focus={{ borderColor: 'primary.500', bg: 'white' }}
              multiline
              numberOfLines={3}
            />
            <FormControl.ErrorMessage>
              {errors.propertyAddress}
            </FormControl.ErrorMessage>
            <FormControl.HelperText>
              Include street address, apartment/unit number, city, and postal code
            </FormControl.HelperText>
          </FormControl>

          {/* Guest Information */}
          <Box bg="white" rounded="lg" p={4} shadow={1}>
            <Heading size="sm" color="gray.700" mb={4}>
              Guest Information
            </Heading>
            
            <VStack space={4}>
              <FormControl isRequired isInvalid={!!errors.guestName}>
                <FormControl.Label>
                  <Text fontWeight="medium" color="gray.600">
                    Guest Name
                  </Text>
                </FormControl.Label>
                <Input
                  placeholder="Enter guest's full name"
                  value={formData.guestName}
                  onChangeText={(value) => handleInputChange('guestName', value)}
                  bg="gray.50"
                  borderColor="gray.300"
                  _focus={{ borderColor: 'primary.500', bg: 'white' }}
                />
                <FormControl.ErrorMessage>
                  {errors.guestName}
                </FormControl.ErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.guestCount}>
                <FormControl.Label>
                  <Text fontWeight="medium" color="gray.600">
                    Number of Guests
                  </Text>
                </FormControl.Label>
                <HStack alignItems="center" space={4}>
                  <Pressable
                    onPress={() => handleInputChange('guestCount', Math.max(1, formData.guestCount - 1))}
                    bg="gray.200"
                    rounded="full"
                    p={2}
                    _pressed={{ bg: 'gray.300' }}
                  >
                    <Icon as={MaterialIcons} name="remove" size="sm" color="gray.600" />
                  </Pressable>
                  
                  <Box bg="gray.50" px={6} py={2} rounded="md" minW={16}>
                    <Text textAlign="center" fontSize="lg" fontWeight="medium">
                      {formData.guestCount}
                    </Text>
                  </Box>
                  
                  <Pressable
                    onPress={() => handleInputChange('guestCount', Math.min(20, formData.guestCount + 1))}
                    bg="gray.200"
                    rounded="full"
                    p={2}
                    _pressed={{ bg: 'gray.300' }}
                  >
                    <Icon as={MaterialIcons} name="add" size="sm" color="gray.600" />
                  </Pressable>
                </HStack>
                <FormControl.ErrorMessage>
                  {errors.guestCount}
                </FormControl.ErrorMessage>
              </FormControl>
            </VStack>
          </Box>

          {/* Check-in Date & Time */}
          <Box bg="white" rounded="lg" p={4} shadow={1}>
            <FormControl isRequired isInvalid={!!errors.checkInTime}>
              <FormControl.Label>
                <Text fontWeight="bold" color="gray.700" mb={2}>
                  Check-in Date & Time
                </Text>
              </FormControl.Label>
              
              <VStack space={3}>
                <HStack space={3}>
                  <Pressable
                    flex={1}
                    onPress={() => setShowDatePicker(true)}
                    bg="gray.50"
                    p={4}
                    rounded="md"
                    borderWidth={1}
                    borderColor="gray.300"
                  >
                    <HStack alignItems="center" space={2}>
                      <Icon as={MaterialIcons} name="calendar-today" size="sm" color="gray.600" />
                      <Text color="gray.700">
                        {formatDate(formData.checkInTime)}
                      </Text>
                    </HStack>
                  </Pressable>
                  
                  <Pressable
                    flex={1}
                    onPress={() => setShowTimePicker(true)}
                    bg="gray.50"
                    p={4}
                    rounded="md"
                    borderWidth={1}
                    borderColor="gray.300"
                  >
                    <HStack alignItems="center" space={2}>
                      <Icon as={MaterialIcons} name="access-time" size="sm" color="gray.600" />
                      <Text color="gray.700">
                        {formatTime(formData.checkInTime)}
                      </Text>
                    </HStack>
                  </Pressable>
                </HStack>
              </VStack>
              
              <FormControl.ErrorMessage>
                {errors.checkInTime}
              </FormControl.ErrorMessage>
            </FormControl>
          </Box>

          {/* Special Instructions */}
          <FormControl>
            <FormControl.Label>
              <Text fontWeight="bold" color="gray.700">
                Special Instructions (Optional)
              </Text>
            </FormControl.Label>
            <Input
              placeholder="Any special instructions for the agent (e.g., building access codes, parking information, etc.)"
              value={formData.specialInstructions || ''}
              onChangeText={(value) => handleInputChange('specialInstructions', value)}
              bg="white"
              borderColor="gray.300"
              _focus={{ borderColor: 'primary.500', bg: 'white' }}
              multiline
              numberOfLines={3}
            />
            <FormControl.HelperText>
              Provide any additional information that might help the agent
            </FormControl.HelperText>
          </FormControl>

          {/* Pricing Information */}
          <Box bg="secondary.50" rounded="lg" p={4} borderWidth={1} borderColor="secondary.200">
            <Heading size="sm" color="secondary.700" mb={3}>
              Pricing Information
            </Heading>
            <VStack space={2}>
              <HStack justifyContent="space-between">
                <Text color="gray.600">Service Fee:</Text>
                <Text fontWeight="medium" color="gray.800">€20.00</Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text color="gray.600">Platform Fee:</Text>
                <Text fontWeight="medium" color="gray.800">€4.00</Text>
              </HStack>
              <Box h={0.5} bg="gray.300" my={1} />
              <HStack justifyContent="space-between">
                <Text fontWeight="bold" color="gray.800">Total:</Text>
                <Text fontWeight="bold" color="secondary.600" fontSize="lg">€24.00</Text>
              </HStack>
            </VStack>
          </Box>

          {/* Submit Button */}
          <Button
            onPress={handleSubmit}
            isLoading={loading}
            isDisabled={loading}
            bg="primary.500"
            _pressed={{ bg: 'primary.600' }}
            _text={{ fontWeight: 'bold' }}
            size="lg"
            leftIcon={<Icon as={MaterialIcons} name="payment" size="sm" color="white" />}
          >
            {loading ? 'Creating Request...' : 'Create Request & Pay'}
          </Button>
        </VStack>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.checkInTime}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={formData.checkInTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </KeyboardAvoidingView>
  );
}
