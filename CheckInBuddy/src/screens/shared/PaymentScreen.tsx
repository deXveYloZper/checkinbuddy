import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  Divider,
  Icon,
  Alert,
  Center,
  Spinner,
  Progress,
  Pressable,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import apiService from '../../services/api';
import { CheckInRequest, AppStackParamList } from '../../types';
import type { AppStackNavigationProp } from '../../types';

type PaymentScreenRouteProp = RouteProp<AppStackParamList, 'Payment'>;

interface Props {
  navigation: AppStackNavigationProp;
  route: PaymentScreenRouteProp;
}

export default function PaymentScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<CheckInRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const fetchRequest = async () => {
    try {
      const requestData = await apiService.getCheckInRequest(requestId);
      setRequest(requestData);
    } catch (err: any) {
      console.error('Fetch request error:', err);
      setError(err.message || 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    setError(null);

    try {
      // For MVP, we'll simulate payment success
      // In production, this would integrate with Stripe
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(true);
      
      // Navigate back to dashboard after delay
      setTimeout(() => {
        navigation.navigate('HostTabs');
      }, 2000);

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Box flex={1} bg="gray.50">
        <Center flex={1}>
          <Spinner size="lg" color="primary.500" />
          <Text mt={4} color="gray.600">Loading payment details...</Text>
        </Center>
      </Box>
    );
  }

  if (error || !request) {
    return (
      <Box flex={1} bg="gray.50">
        <Box bg="primary.500" pt={12} pb={4} px={4}>
          <HStack alignItems="center" space={3}>
            <Pressable onPress={handleBack}>
              <Icon as={MaterialIcons} name="arrow-back" size="lg" color="white" />
            </Pressable>
            <Heading color="white" size="lg" flex={1}>
              Payment
            </Heading>
          </HStack>
        </Box>
        
        <Center flex={1} p={6}>
          <Icon as={MaterialIcons} name="error" size={16} color="red.500" mb={4} />
          <Heading size="md" color="red.600" textAlign="center" mb={2}>
            Error Loading Payment
          </Heading>
          <Text color="gray.600" textAlign="center" mb={6}>
            {error || 'Unable to load request details'}
          </Text>
          <Button onPress={handleBack} variant="outline">
            Go Back
          </Button>
        </Center>
      </Box>
    );
  }

  if (success) {
    return (
      <Box flex={1} bg="gray.50">
        <Box bg="primary.500" pt={12} pb={4} px={4}>
          <HStack alignItems="center" space={3}>
            <Heading color="white" size="lg" flex={1}>
              Payment
            </Heading>
          </HStack>
        </Box>
        
        <Center flex={1} p={6}>
          <Icon as={MaterialIcons} name="check-circle" size={20} color="green.500" mb={4} />
          <Heading size="lg" color="green.600" textAlign="center" mb={2}>
            Payment Successful!
          </Heading>
          <Text color="gray.600" textAlign="center" mb={4}>
            Your check-in request has been paid for and is now live.
          </Text>
          <Text color="gray.500" fontSize="sm" textAlign="center">
            Redirecting to dashboard...
          </Text>
          <Progress value={100} colorScheme="green" mt={4} w="full" />
        </Center>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="gray.50">
      {/* Header */}
      <Box bg="primary.500" pt={12} pb={4} px={4}>
        <HStack alignItems="center" space={3}>
          <Pressable onPress={handleBack}>
            <Icon as={MaterialIcons} name="arrow-back" size="lg" color="white" />
          </Pressable>
          <Heading color="white" size="lg" flex={1}>
            Payment
          </Heading>
        </HStack>
      </Box>

      {/* Payment Form */}
      <VStack space={6} p={4}>
        {/* Request Summary */}
        <Card>
          <VStack space={3} p={4}>
            <Heading size="md" color="gray.800">
              Request Summary
            </Heading>
            
            <VStack space={2}>
              <HStack justifyContent="space-between">
                <Text color="gray.600">Property:</Text>
                <Text flex={1} textAlign="right" numberOfLines={2}>
                  {request.propertyAddress}
                </Text>
              </HStack>
              
              <HStack justifyContent="space-between">
                <Text color="gray.600">Guest:</Text>
                <Text>{request.guestName}</Text>
              </HStack>
              
              <HStack justifyContent="space-between">
                <Text color="gray.600">Check-in Time:</Text>
                <Text>
                  {new Date(request.checkInTime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </Card>

        {/* Payment Breakdown */}
        <Card>
          <VStack space={3} p={4}>
            <Heading size="md" color="gray.800">
              Payment Details
            </Heading>
            
            <VStack space={2}>
              <HStack justifyContent="space-between">
                <Text color="gray.600">Service Fee:</Text>
                <Text>{formatCurrency(request.fee)}</Text>
              </HStack>
              
              <HStack justifyContent="space-between">
                <Text color="gray.600">Platform Fee:</Text>
                <Text>{formatCurrency(request.platformFee)}</Text>
              </HStack>
              
              <Divider />
              
              <HStack justifyContent="space-between">
                <Text fontWeight="bold" fontSize="lg">Total:</Text>
                <Text fontWeight="bold" fontSize="lg" color="primary.600">
                  {formatCurrency(request.fee + request.platformFee)}
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </Card>

        {/* Payment Method Placeholder */}
        <Card>
          <VStack space={4} p={4}>
            <Heading size="md" color="gray.800">
              Payment Method
            </Heading>
            
            <Box>
              <Text color="gray.600" mb={2}>Credit Card</Text>
              <Box
                borderWidth={1}
                borderColor="gray.300"
                borderRadius="md"
                p={4}
                bg="gray.100"
              >
                <Text color="gray.500" textAlign="center">
                  💳 Stripe Payment Integration
                </Text>
                <Text color="gray.400" fontSize="sm" textAlign="center" mt={1}>
                  (Demo mode - payment will be simulated)
                </Text>
              </Box>
              
              <Text color="gray.500" fontSize="xs" mt={2}>
                Your payment information is secure and encrypted
              </Text>
            </Box>
            
            {error && (
              <Alert status="error" borderRadius="lg">
                <Alert.Icon />
                <Text color="error.600">{error}</Text>
              </Alert>
            )}
          </VStack>
        </Card>

        {/* Payment Button */}
        <Button
          onPress={handlePayment}
          isLoading={paymentLoading}
          isLoadingText="Processing payment..."
          colorScheme="primary"
          size="lg"
          leftIcon={<Icon as={MaterialIcons} name="payment" />}
        >
          Pay {formatCurrency(request.fee + request.platformFee)}
        </Button>

        <Text color="gray.500" fontSize="xs" textAlign="center">
          By completing this payment, you agree to our terms of service.
          This is a demo payment that will be automatically approved.
        </Text>
      </VStack>
    </Box>
  );
}
