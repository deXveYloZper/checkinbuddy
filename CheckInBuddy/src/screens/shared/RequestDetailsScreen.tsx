import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  Badge,
  Icon,
  Center,
  Spinner,
  Alert,
  Pressable,
  ScrollView,
  Divider,
  Avatar,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RefreshControl } from 'react-native';

import apiService from '../../services/api';
import { CheckInRequest, CheckInStatus, AppStackParamList } from '../../types';
import type { AppStackNavigationProp } from '../../types';

type RequestDetailsScreenRouteProp = RouteProp<AppStackParamList, 'RequestDetails'>;

interface Props {
  navigation: AppStackNavigationProp;
  route: RequestDetailsScreenRouteProp;
}

export default function RequestDetailsScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [request, setRequest] = useState<CheckInRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const fetchRequest = async () => {
    try {
      setError(null);
      const requestData = await apiService.getCheckInRequest(requestId);
      setRequest(requestData);
    } catch (err: any) {
      console.error('Fetch request error:', err);
      setError(err.message || 'Failed to load request details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequest();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDocumentUpload = () => {
    if (!request) return;
    navigation.navigate('DocumentUpload', { requestId: request.id });
  };

  const handleAcceptRequest = async () => {
    if (!request) return;
    
    try {
      await apiService.acceptCheckInRequest(request.id);
      await fetchRequest(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to accept request');
    }
  };

  const handleCompleteRequest = async () => {
    if (!request) return;
    
    try {
      await apiService.completeCheckInRequest(request.id);
      await fetchRequest(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to complete request');
    }
  };

  const getStatusColor = (status: CheckInStatus) => {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'accepted':
        return 'blue';
      case 'in_progress':
        return 'purple';
      case 'completed':
        return 'green';
      case 'cancelled_host':
      case 'cancelled_agent':
        return 'red';
      case 'expired':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: CheckInStatus) => {
    switch (status) {
      case 'pending':
        return 'schedule';
      case 'accepted':
        return 'check-circle';
      case 'in_progress':
        return 'play-circle-filled';
      case 'completed':
        return 'done-all';
      case 'cancelled_host':
      case 'cancelled_agent':
        return 'cancel';
      case 'expired':
        return 'timer-off';
      default:
        return 'help';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const formatStatusText = (status: CheckInStatus) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Box flex={1} bg="gray.50">
        <Center flex={1}>
          <Spinner size="lg" color="primary.500" />
          <Text mt={4} color="gray.600">Loading request details...</Text>
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
              Request Details
            </Heading>
          </HStack>
        </Box>
        
        <Center flex={1} p={6}>
          <Icon as={MaterialIcons} name="error" size={16} color="red.500" mb={4} />
          <Heading size="md" color="red.600" textAlign="center" mb={2}>
            Error Loading Request
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

  return (
    <Box flex={1} bg="gray.50">
      {/* Header */}
      <Box bg="primary.500" pt={12} pb={4} px={4}>
        <HStack alignItems="center" space={3}>
          <Pressable onPress={handleBack}>
            <Icon as={MaterialIcons} name="arrow-back" size="lg" color="white" />
          </Pressable>
          <Heading color="white" size="lg" flex={1}>
            Request Details
          </Heading>
        </HStack>
      </Box>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <VStack space={4} p={4}>
          {/* Status Card */}
          <Card>
            <VStack space={3} p={4}>
              <HStack alignItems="center" justifyContent="space-between">
                <Heading size="md" color="gray.800">
                  Request Status
                </Heading>
                <Badge
                  colorScheme={getStatusColor(request.status)}
                  variant="solid"
                  leftIcon={<Icon as={MaterialIcons} name={getStatusIcon(request.status)} size="xs" />}
                >
                  {formatStatusText(request.status)}
                </Badge>
              </HStack>
            </VStack>
          </Card>

          {/* Property Details */}
          <Card>
            <VStack space={3} p={4}>
              <Heading size="md" color="gray.800">
                Property Information
              </Heading>
              
              <VStack space={2}>
                <HStack alignItems="flex-start" space={3}>
                  <Icon as={MaterialIcons} name="location-on" size="sm" color="gray.500" mt={0.5} />
                  <Text flex={1} color="gray.700">
                    {request.propertyAddress}
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </Card>

          {/* Guest Details */}
          <Card>
            <VStack space={3} p={4}>
              <Heading size="md" color="gray.800">
                Guest Information
              </Heading>
              
              <VStack space={2}>
                <HStack justifyContent="space-between">
                  <Text color="gray.600">Guest Name:</Text>
                  <Text fontWeight="medium">{request.guestName}</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text color="gray.600">Number of Guests:</Text>
                  <Text fontWeight="medium">{request.guestCount}</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text color="gray.600">Check-in Time:</Text>
                  <Text fontWeight="medium">{formatDate(request.checkInTime)}</Text>
                </HStack>
              </VStack>
            </VStack>
          </Card>

          {/* Payment Details */}
          <Card>
            <VStack space={3} p={4}>
              <Heading size="md" color="gray.800">
                Payment Information
              </Heading>
              
              <VStack space={2}>
                <HStack justifyContent="space-between">
                  <Text color="gray.600">Service Fee:</Text>
                  <Text fontWeight="medium">{formatCurrency(request.fee)}</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text color="gray.600">Platform Fee:</Text>
                  <Text fontWeight="medium">{formatCurrency(request.platformFee)}</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text color="gray.600">Agent Payout:</Text>
                  <Text fontWeight="medium">{formatCurrency(request.agentPayout)}</Text>
                </HStack>
                
                <Divider />
                
                <HStack justifyContent="space-between">
                  <Text fontWeight="bold">Total Paid:</Text>
                  <Text fontWeight="bold" color="primary.600">
                    {formatCurrency(request.fee + request.platformFee)}
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </Card>

          {/* Host/Agent Information */}
          {request.host && (
            <Card>
              <VStack space={3} p={4}>
                <Heading size="md" color="gray.800">
                  Host Information
                </Heading>
                
                <HStack space={3} alignItems="center">
                  <Avatar bg="primary.500" size="md">
                    <Icon as={MaterialIcons} name="person" color="white" />
                  </Avatar>
                  <VStack>
                    <Text fontWeight="medium" fontSize="md">{request.host.name}</Text>
                    <Text color="gray.600" fontSize="sm">{request.host.email}</Text>
                  </VStack>
                </HStack>
              </VStack>
            </Card>
          )}

          {request.agent && (
            <Card>
              <VStack space={3} p={4}>
                <Heading size="md" color="gray.800">
                  Agent Information
                </Heading>
                
                <HStack space={3} alignItems="center">
                  <Avatar bg="green.500" size="md">
                    <Icon as={MaterialIcons} name="person" color="white" />
                  </Avatar>
                  <VStack>
                    <Text fontWeight="medium" fontSize="md">{request.agent.name}</Text>
                    <Text color="gray.600" fontSize="sm">{request.agent.email}</Text>
                  </VStack>
                </HStack>
              </VStack>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert status="error" borderRadius="lg">
              <Alert.Icon />
              <Text color="error.600">{error}</Text>
            </Alert>
          )}
        </VStack>
      </ScrollView>

      {/* Action Buttons */}
      <Box bg="white" p={4} shadow={2}>
        <VStack space={2}>
          {/* Agent Actions */}
          {request.status === 'pending' && (
            <Button
              onPress={handleAcceptRequest}
              colorScheme="green"
              size="lg"
              leftIcon={<Icon as={MaterialIcons} name="check" />}
            >
              Accept Request
            </Button>
          )}

          {request.status === 'accepted' && (
            <Button
              onPress={handleDocumentUpload}
              colorScheme="blue"
              size="lg"
              leftIcon={<Icon as={MaterialIcons} name="upload-file" />}
            >
              Upload Documents
            </Button>
          )}

          {request.status === 'in_progress' && (
            <Button
              onPress={handleCompleteRequest}
              colorScheme="green"
              size="lg"
              leftIcon={<Icon as={MaterialIcons} name="done-all" />}
            >
              Complete Check-in
            </Button>
          )}

          {/* Universal Actions */}
          {(request.status === 'accepted' || request.status === 'in_progress') && (
            <Button
              onPress={handleDocumentUpload}
              variant="outline"
              colorScheme="primary"
              size="lg"
              leftIcon={<Icon as={MaterialIcons} name="folder" />}
            >
              View Documents
            </Button>
          )}
        </VStack>
      </Box>
    </Box>
  );
}
