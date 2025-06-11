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
  Avatar,
  Progress,
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
      const [activeRequests, recentRequests, statsResponse] = await Promise.all([
        apiService.getMyRequests('active'),
        apiService.getMyRequests('recent'),
        apiService.getHostStats(),
      ]);

      setActiveRequests(activeRequests);
      setRecentRequests(recentRequests);
      setStats(statsResponse);
    } catch (err: unknown) {
      console.error('Dashboard fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
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
    const now = new Date();
    const diffInHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24 && diffInHours > 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48 && diffInHours > 24) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const formatStatusText = (status: CheckInStatus) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCompletionRate = () => {
    if (stats.totalRequests === 0) return 0;
    return (stats.completedRequests / stats.totalRequests) * 100;
  };

  const handleRequestPress = (request: CheckInRequest) => {
    navigation.navigate('RequestDetails', { requestId: request.id });
  };

  const handleCreateRequest = () => {
    navigation.navigate('CreateRequest');
  };

  const handleViewAllRequests = () => {
    // Navigate to the Requests tab in the host flow
    navigation.getParent()?.navigate('Requests');
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
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Header */}
        <Box bg="primary.500" pt={12} pb={6} px={4}>
          <VStack space={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack>
                <Heading color="white" size="lg">
                  Welcome back! 👋
                </Heading>
                <Text color="white" opacity={0.8} fontSize="md">
                  Manage your check-in requests
                </Text>
              </VStack>
              <Avatar bg="white" size="md">
                <Icon as={MaterialIcons} name="person" color="primary.500" size="lg" />
              </Avatar>
            </HStack>
            
            {/* Enhanced Stats Cards */}
            <VStack space={3}>
              <HStack space={3} justifyContent="space-between">
                <Box bg="white" rounded="xl" p={4} flex={1} shadow="2">
                  <VStack space={1}>
                    <HStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="xs" color="gray.600" fontWeight="medium">Total Requests</Text>
                      <Icon as={MaterialIcons} name="assignment" color="primary.500" size="sm" />
                    </HStack>
                    <Text fontSize="2xl" fontWeight="bold" color="primary.600">
                      {stats.totalRequests}
                    </Text>
                  </VStack>
                </Box>
                
                <Box bg="white" rounded="xl" p={4} flex={1} shadow="2">
                  <VStack space={1}>
                    <HStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="xs" color="gray.600" fontWeight="medium">Completed</Text>
                      <Icon as={MaterialIcons} name="check-circle" color="green.500" size="sm" />
                    </HStack>
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      {stats.completedRequests}
                    </Text>
                  </VStack>
                </Box>
              </HStack>
              
              <Box bg="white" rounded="xl" p={4} shadow="2">
                <VStack space={3}>
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">Total Spent</Text>
                    <Text fontSize="xl" fontWeight="bold" color="secondary.600">
                      {formatCurrency(stats.totalSpent)}
                    </Text>
                  </HStack>
                  <VStack space={1}>
                    <HStack justifyContent="space-between">
                      <Text fontSize="xs" color="gray.500">Completion Rate</Text>
                      <Text fontSize="xs" color="gray.500">{getCompletionRate().toFixed(1)}%</Text>
                    </HStack>
                    <Progress 
                      value={getCompletionRate()} 
                      colorScheme="green" 
                      size="sm" 
                      rounded="full"
                    />
                  </VStack>
                </VStack>
              </Box>
            </VStack>
            
            {/* Create Request Button */}
            <Button
              bg="white"
              _pressed={{ bg: 'gray.100' }}
              _text={{ color: 'primary.600', fontWeight: 'bold' }}
              leftIcon={<Icon as={MaterialIcons} name="add" size="sm" color="primary.600" />}
              onPress={handleCreateRequest}
              rounded="xl"
              shadow="2"
            >
              Create New Request
            </Button>
          </VStack>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert status="error" mx={4} mt={4} rounded="lg">
            <Alert.Icon />
            <Text>{error}</Text>
          </Alert>
        )}

        {/* Active Requests Section */}
        <VStack space={4} p={4}>
          <HStack justifyContent="space-between" alignItems="center">
            <Heading size="lg" color="gray.800">
              Active Requests
            </Heading>
            {activeRequests.length > 0 && (
              <HStack space={2} alignItems="center">
                <Badge colorScheme="primary" rounded="full" variant="solid">
                  {activeRequests.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  _text={{ color: 'primary.600', fontSize: 'sm' }}
                  onPress={handleViewAllRequests}
                >
                  View All
                </Button>
              </HStack>
            )}
          </HStack>

          {activeRequests.length === 0 ? (
            <Card bg="white" rounded="xl" shadow="2">
              <Box p={8}>
                <Center>
                  <Box bg="gray.100" rounded="full" p={4} mb={4}>
                    <Icon
                      as={MaterialIcons}
                      name="inbox"
                      size={10}
                      color="gray.400"
                    />
                  </Box>
                  <Heading size="md" color="gray.600" mb={2}>
                    No active requests
                  </Heading>
                  <Text color="gray.500" fontSize="sm" textAlign="center" mb={4}>
                    Create your first check-in request to get started with our platform
                  </Text>
                  <Button
                    variant="outline"
                    colorScheme="primary"
                    onPress={handleCreateRequest}
                    leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
                  >
                    Create Request
                  </Button>
                </Center>
              </Box>
            </Card>
          ) : (
            <VStack space={3}>
              {activeRequests.map((request) => (
                <Pressable key={request.id} onPress={() => handleRequestPress(request)}>
                  <Card bg="white" rounded="xl" shadow="2">
                    <Box p={4}>
                      <VStack space={3}>
                        <HStack justifyContent="space-between" alignItems="flex-start">
                          <VStack flex={1} space={1}>
                            <HStack alignItems="center" space={2}>
                              <Icon 
                                as={MaterialIcons} 
                                name="person" 
                                color="gray.500" 
                                size="sm" 
                              />
                              <Text fontWeight="bold" color="gray.800" fontSize="md">
                                {request.guestName}
                              </Text>
                              {request.guestCount > 1 && (
                                <Badge size="sm" colorScheme="gray" rounded="md">
                                  +{request.guestCount - 1}
                                </Badge>
                              )}
                            </HStack>
                            <HStack alignItems="center" space={2}>
                              <Icon 
                                as={MaterialIcons} 
                                name="location-on" 
                                color="gray.500" 
                                size="sm" 
                              />
                              <Text fontSize="sm" color="gray.600" numberOfLines={2} flex={1}>
                                {request.propertyAddress}
                              </Text>
                            </HStack>
                            <HStack alignItems="center" space={2}>
                              <Icon 
                                as={MaterialIcons} 
                                name="schedule" 
                                color="gray.500" 
                                size="sm" 
                              />
                              <Text fontSize="sm" color="gray.500">
                                {formatDate(request.checkInTime)}
                              </Text>
                            </HStack>
                          </VStack>
                          <VStack alignItems="flex-end" space={2}>
                            <Badge 
                              colorScheme={getStatusColor(request.status)} 
                              rounded="lg"
                              variant="solid"
                              leftIcon={
                                <Icon 
                                  as={MaterialIcons} 
                                  name={getStatusIcon(request.status)} 
                                  size="xs" 
                                />
                              }
                            >
                              {formatStatusText(request.status)}
                            </Badge>
                            <Text fontSize="lg" fontWeight="bold" color="gray.700">
                              {formatCurrency(request.fee)}
                            </Text>
                          </VStack>
                        </HStack>
                        
                        {request.agent && (
                          <HStack alignItems="center" space={2} bg="blue.50" p={2} rounded="lg">
                            <Icon as={MaterialIcons} name="person" color="blue.500" size="sm" />
                            <Text fontSize="sm" color="blue.700" fontWeight="medium">
                              Agent: {request.agent.name}
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                  </Card>
                </Pressable>
              ))}
            </VStack>
          )}

          {/* Recent History Section */}
          <Divider mt={6} mb={4} />
          
          <HStack justifyContent="space-between" alignItems="center">
            <Heading size="lg" color="gray.800">
              Recent History
            </Heading>
            {recentRequests.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                _text={{ color: 'primary.600', fontSize: 'sm' }}
                onPress={handleViewAllRequests}
              >
                View All
              </Button>
            )}
          </HStack>

          {recentRequests.length === 0 ? (
            <Card bg="white" rounded="xl" shadow="2">
              <Box p={6}>
                <Center>
                  <Icon
                    as={MaterialIcons}
                    name="history"
                    size={8}
                    color="gray.400"
                    mb={2}
                  />
                  <Text color="gray.500" fontSize="sm" textAlign="center">
                    No recent activity
                  </Text>
                </Center>
              </Box>
            </Card>
          ) : (
            <VStack space={2}>
              {recentRequests.slice(0, 5).map((request) => (
                <Pressable key={request.id} onPress={() => handleRequestPress(request)}>
                  <Box bg="white" rounded="lg" p={3} shadow="1">
                    <HStack justifyContent="space-between" alignItems="center">
                      <HStack alignItems="center" space={3} flex={1}>
                        <Icon 
                          as={MaterialIcons} 
                          name={getStatusIcon(request.status)} 
                          color={`${getStatusColor(request.status)}.500`} 
                          size="md" 
                        />
                        <VStack flex={1}>
                          <Text fontSize="sm" fontWeight="medium" color="gray.800" numberOfLines={1}>
                            {request.guestName}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(request.checkInTime)}
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack alignItems="center" space={3}>
                        <Badge
                          colorScheme={getStatusColor(request.status)}
                          size="sm"
                          rounded="md"
                          variant="subtle"
                        >
                          {formatStatusText(request.status)}
                        </Badge>
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">
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
