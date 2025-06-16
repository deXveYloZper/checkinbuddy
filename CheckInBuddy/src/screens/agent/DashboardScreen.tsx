import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  ScrollView,
  Card,
  Icon,
  Button,
  Center,
  Spinner,
  Alert,
  Pressable,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import apiService from '../../services/api';
import { CheckInRequest, CheckInStatus, AgentTabNavigationProp, SharedStackNavigationProp } from '../../types';

export default function AgentDashboardScreen() {
  const tabNavigation = useNavigation<AgentTabNavigationProp>();
  const stackNavigation = useNavigation<SharedStackNavigationProp>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState({
    totalEarned: 0,
    completedRequests: 0,
    averageRating: 0,
    activeRequests: 0,
  });
  const [recentRequests, setRecentRequests] = React.useState<CheckInRequest[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [statsResponse, requestsResponse] = await Promise.all([
        apiService.getAgentStats(),
        apiService.getAgentRequests(),
      ]);
      setStats(statsResponse);
      setRecentRequests(requestsResponse.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPress = (request: CheckInRequest) => {
    stackNavigation.navigate('RequestDetails', { requestId: request.id });
  };

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const getStatusColor = (status: CheckInStatus) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'accepted': return 'blue';
      case 'in_progress': return 'purple';
      case 'completed': return 'green';
      case 'cancelled_host':
      case 'cancelled_agent': return 'red';
      case 'expired': return 'gray';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <Box flex={1} bg="gray.50" justifyContent="center" alignItems="center">
        <Spinner size="lg" color="primary.500" />
      </Box>
    );
  }

  return (
    <ScrollView bg="gray.50">
      <VStack space={4} p={4}>
        <Heading size="xl" color="primary.600">Agent Dashboard</Heading>
        {error && (
          <Alert status="error" mb={4}>
            <Alert.Icon />
            <Text color="error.600" fontWeight="medium">Error</Text>
            <Text color="error.600">{error}</Text>
          </Alert>
        )}
        <HStack space={4} flexWrap="wrap">
          <Card flex={1} minW="150" bg="white">
            <VStack space={2} p={4}>
              <Text color="gray.500" fontSize="sm">Total Earned</Text>
              <Heading size="lg" color="primary.600">{formatCurrency(stats.totalEarned)}</Heading>
            </VStack>
          </Card>
          <Card flex={1} minW="150" bg="white">
            <VStack space={2} p={4}>
              <Text color="gray.500" fontSize="sm">Completed</Text>
              <Heading size="lg" color="primary.600">{stats.completedRequests}</Heading>
            </VStack>
          </Card>
          <Card flex={1} minW="150" bg="white">
            <VStack space={2} p={4}>
              <Text color="gray.500" fontSize="sm">Active</Text>
              <Heading size="lg" color="primary.600">{stats.activeRequests}</Heading>
            </VStack>
          </Card>
        </HStack>
        <Card bg="white">
          <VStack space={4} p={4}>
            <Heading size="md">Quick Actions</Heading>
            <HStack space={4} flexWrap="wrap">
              <Button 
                flex={1} 
                minW="150" 
                leftIcon={<Icon as={MaterialIcons} name="map" size="sm" />} 
                onPress={() => tabNavigation.navigate('Map')}
              >
                Find Requests
              </Button>
              <Button 
                flex={1} 
                minW="150" 
                leftIcon={<Icon as={MaterialIcons} name="list" size="sm" />} 
                onPress={() => tabNavigation.navigate('MyRequests')}
              >
                My Requests
              </Button>
            </HStack>
          </VStack>
        </Card>
        <Card bg="white">
          <VStack space={4} p={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <Heading size="md">Recent Requests</Heading>
              <Button 
                variant="ghost" 
                onPress={() => tabNavigation.navigate('MyRequests')}
              >
                View All
              </Button>
            </HStack>
            {recentRequests.length === 0 ? (
              <Center py={4}><Text color="gray.500">No recent requests</Text></Center>
            ) : (
              <VStack space={3}>
                {recentRequests.map((request) => (
                  <Pressable key={request.id} onPress={() => handleRequestPress(request)}>
                    <VStack space={2} p={3} bg="gray.50" rounded="md">
                      <HStack justifyContent="space-between" alignItems="center">
                        <Text fontWeight="medium" fontSize="sm">{request.propertyAddress}</Text>
                        <Text color="gray.500" fontSize="xs">{formatDate(request.checkInTime)}</Text>
                      </HStack>
                      <HStack justifyContent="space-between" alignItems="center">
                        <Text color="gray.600" fontSize="sm">{request.guestName} ({request.guestCount} guests)</Text>
                        <Text color={`${getStatusColor(request.status)}.600`} fontSize="sm" fontWeight="medium">
                          {request.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                      </HStack>
                    </VStack>
                  </Pressable>
                ))}
              </VStack>
            )}
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  );
} 