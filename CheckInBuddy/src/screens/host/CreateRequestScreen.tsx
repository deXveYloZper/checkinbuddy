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
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList, CreateRequestForm } from '../../types';
import apiService from '../../services/api';

type CreateRequestScreenNavigationProp = StackNavigationProp<AppStackParamList, 'CreateRequest'>;

interface Props {
  navigation: CreateRequestScreenNavigationProp;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function CreateRequestScreen({ navigation }: Props) {
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
  const [touched, setTouched] = useState<Partial<Record<keyof CreateRequestForm, boolean>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateRequestForm, string>> = {};

    if (!formData.propertyAddress.trim()) {
      newErrors.propertyAddress = 'Property address is required';
    }

    if (!formData.guestName.trim()) {
      newErrors.guestName = 'Guest name is required';
    }

    if (formData.guestCount < 1) {
      newErrors.guestCount = 'Guest count must be at least 1';
    }

    const now = new Date();
    if (formData.checkInTime <= now) {
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

  const handleSubmit = async () => {
    setTouched({
      propertyAddress: true,
      guestName: true,
      guestCount: true,
      checkInTime: true,
    });
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.createCheckInRequest({
        propertyAddress: formData.propertyAddress,
        guestName: formData.guestName,
        guestCount: formData.guestCount,
        checkInTime: formData.checkInTime.toISOString(),
        notes: formData.specialInstructions,
      });

      setSuccess(true);
      
      // Navigate to payment screen after successful creation
      setTimeout(() => {
        navigation.navigate('Payment', { requestId: response.id });
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

          {/* Request Form */}
          <VStack space={4} bg="white" p={6} borderRadius="xl" shadow={2}>
            <FormControl isInvalid={!!(touched.propertyAddress && errors.propertyAddress)}>
              <FormControl.Label>Property Address</FormControl.Label>
              <TextArea
                placeholder="Enter the full property address"
                value={formData.propertyAddress}
                onChangeText={(text) => handleInputChange('propertyAddress', text)}
                onBlur={() => handleBlur('propertyAddress')}
                autoCapitalize="words"
                h={20}
                w="100%"
                autoCompleteType="off"
                isFocused={false}
                outlineColor="gray.300"
                outlineStyle="solid"
                shadow={0}
                overflow="hidden"
              />
              <FormControl.ErrorMessage>
                {errors.propertyAddress}
              </FormControl.ErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!(touched.guestName && errors.guestName)}>
              <FormControl.Label>Guest Name</FormControl.Label>
              <Input
                placeholder="Enter guest's full name"
                value={formData.guestName}
                onChangeText={(text) => handleInputChange('guestName', text)}
                onBlur={() => handleBlur('guestName')}
                autoCapitalize="words"
              />
              <FormControl.ErrorMessage>
                {errors.guestName}
              </FormControl.ErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!(touched.guestCount && errors.guestCount)}>
              <FormControl.Label>Number of Guests</FormControl.Label>
              <Input
                placeholder="Enter number of guests"
                value={formData.guestCount.toString()}
                onChangeText={(text) => {
                  const count = parseInt(text) || 0;
                  handleInputChange('guestCount', count);
                }}
                onBlur={() => handleBlur('guestCount')}
                keyboardType="number-pad"
              />
              <FormControl.ErrorMessage>
                {errors.guestCount}
              </FormControl.ErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!(touched.checkInTime && errors.checkInTime)}>
              <FormControl.Label>Check-in Time</FormControl.Label>
              <HStack space={2}>
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
              <FormControl.ErrorMessage>
                {errors.checkInTime}
              </FormControl.ErrorMessage>
            </FormControl>

            <FormControl>
              <FormControl.Label>Additional Notes</FormControl.Label>
              <TextArea
                placeholder="Any special instructions or notes"
                value={formData.specialInstructions}
                onChangeText={(text) => handleInputChange('specialInstructions', text)}
                autoCapitalize="sentences"
                h={20}
                w="100%"
                autoCompleteType="off"
                isFocused={false}
                outlineColor="gray.300"
                outlineStyle="solid"
                shadow={0}
                overflow="hidden"
              />
            </FormControl>

            <Button
              mt={4}
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
