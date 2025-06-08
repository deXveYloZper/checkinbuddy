import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  ScrollView,
  Pressable,
  Badge,
  Divider,
  Icon,
  Center,
  Spinner,
  Alert,
  Button,
  Card,
  useTheme,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RefreshControl } from 'react-native';

import apiService from '../../services/api';
import { CheckInRequest, CheckInStatus } from '../../types';
import type { AppStackNavigationProp } from '../../types';

export default function DashboardScreen() {
  const navigation = useNavigation<AppStackNavigationProp>();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeRequests, setActiveRequests] = useState<CheckInRequest[]>([]);
  const [recentRequests, setRecentRequests] = useState<CheckInRequest[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    completedRequests: 0,
    totalSpent: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [activeResponse, recentResponse, statsResponse] = await Promise.all([
        apiService.getMyCheckInRequests('active'),
        apiService.getMyCheckInRequests('recent'),
        apiService.getHostStats(),
      ]);

      setActiveRequests(activeResponse.data);
      setRecentRequests(recentResponse.data);
      setStats(statsResponse.data);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const handleRequestPress = (request: CheckInRequest) => {
    navigation.navigate('RequestDetails', { requestId: request.id });
  };

  const handleCreateRequest = () => {
    navigation.navigate('CreateRequest');
  };

  if (loading) {
    return (
      <Box flex={1} bg="gray.50">
        <Center flex={1}>
          <Spinner size="lg" color="primary.500" />
          <Text mt={4} color="gray.600">Loading dashboard...</Text>
        </Center>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="gray.50">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <Box bg="primary.500" pt={12} pb={6} px={4}>
          <VStack space={4}>
            <Heading color="white" size="lg">
              Dashboard
            </Heading>
            
            {/* Quick Stats */}
            <HStack space={4} justifyContent="space-between">
              <Box bg="white" rounded="lg" p={3} flex={1} opacity={0.95}>
                <Text fontSize="xs" color="gray.600">Total Requests</Text>
                <Text fontSize="lg" fontWeight="bold" color="primary.600">
                  {stats.totalRequests}
                </Text>
              </Box>
              <Box bg="white" rounded="lg" p={3} flex={1} opacity={0.95}>
                <Text fontSize="xs" color="gray.600">Completed</Text>
                <Text fontSize="lg" fontWeight="bold" color="green.600">
                  {stats.completedRequests}
                </Text>
              </Box>
              <Box bg="white" rounded="lg" p={3} flex={1} opacity={0.95}>
                <Text fontSize="xs" color="gray.600">Total Spent</Text>
                <Text fontSize="lg" fontWeight="bold" color="secondary.600">
                  {formatCurrency(stats.totalSpent)}
                </Text>
              </Box>
            </HStack>
            
            {/* Create Request Button */}
            <Button
              bg="white"
              _pressed={{ bg: 'gray.100' }}
              _text={{ color: 'primary.600', fontWeight: 'bold' }}
              leftIcon={<Icon as={MaterialIcons} name="add" size="sm" color="primary.600" />}
              onPress={handleCreateRequest}
            >
              Create New Request
            </Button>
          </VStack>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert status="error" mx={4} mt={4}>
            <Alert.Icon />
            <Text>{error}</Text>
          </Alert>
        )}

        {/* Active Requests */}
        <VStack space={4} p={4}>
          <HStack justifyContent="space-between" alignItems="center">
            <Heading size="md" color="gray.800">
              Active Requests
            </Heading>
            {activeRequests.length > 0 && (
              <Badge colorScheme="primary" rounded="full">
                {activeRequests.length}
              </Badge>
            )}
          </HStack>

          {activeRequests.length === 0 ? (
            <Card>
              <Box p={6}>
                <Center>
                  <Icon
                    as={MaterialIcons}
                    name="inbox"
                    size={12}
                    color="gray.400"
                    mb={3}
                  />
                  <Text color="gray.600" textAlign="center">
                    No active requests
                  </Text>
                  <Text color="gray.500" fontSize="sm" mt={1} textAlign="center">
                    Create your first check-in request to get started
                  </Text>
                </Center>
              </Box>
            </Card>
          ) : (
            <VStack space={3}>
              {activeRequests.map((request) => (
                <Pressable key={request.id} onPress={() => handleRequestPress(request)}>
                  <Card>
                    <Box p={4}>
                      <HStack justifyContent="space-between" alignItems="flex-start">
                        <VStack flex={1} space={1}>
                          <Text fontWeight="bold" color="gray.800">
                            {request.guestName}
                          </Text>
                          <Text fontSize="sm" color="gray.600" numberOfLines={2}>
                            {request.propertyAddress}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Check-in: {formatDate(request.checkInTime)}
                          </Text>
                        </VStack>
                        <VStack alignItems="flex-end" space={1}>
                          <Badge colorScheme={getStatusColor(request.status)} rounded="md">
                            {request.status.replace('_', ' ')}
                          </Badge>
                          <Text fontSize="sm" fontWeight="bold" color="gray.700">
                            {formatCurrency(request.fee)}
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>
                  </Card>
                </Pressable>
              ))}
            </VStack>
          )}

          {/* Recent History */}
          <Divider my={2} />
          
          <Heading size="md" color="gray.800">
            Recent History
          </Heading>

          {recentRequests.length === 0 ? (
            <Text color="gray.500" fontSize="sm" textAlign="center" p={4}>
              No recent requests
            </Text>
          ) : (
            <VStack space={2}>
              {recentRequests.slice(0, 5).map((request) => (
                <Pressable key={request.id} onPress={() => handleRequestPress(request)}>
                  <Box bg="white" rounded="lg" p={3}>
                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack flex={1}>
                        <Text fontSize="sm" fontWeight="medium" color="gray.800">
                          {request.guestName}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {formatDate(request.checkInTime)}
                        </Text>
                      </VStack>
                      <HStack alignItems="center" space={2}>
                        <Badge
                          colorScheme={getStatusColor(request.status)}
                          size="sm"
                          rounded="md"
                        >
                          {request.status}
                        </Badge>
                        <Text fontSize="sm" color="gray.600">
                          {formatCurrency(request.fee)}
                        </Text>
                      </HStack>
                    </HStack>
                  </Box>
                </Pressable>
              ))}
            </VStack>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
}
