import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  FlatList,
  Card,
  Badge,
  Icon,
  Button,
  Center,
  Spinner,
  Alert,
  Input,
  Select,
  Pressable,
  Avatar,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RefreshControl } from 'react-native';

import apiService from '../../services/api';
import { CheckInRequest, CheckInStatus } from '../../types';
import type { AppStackNavigationProp } from '../../types';

export default function AgentRequestsScreen() {
  const navigation = useNavigation<AppStackNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<CheckInRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CheckInRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CheckInStatus | 'all'>('all');
  const [stats, setStats] = useState({
    totalEarned: 0,
    completedRequests: 0,
    averageRating: 0,
  });

  // Fetch requests when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchAgentRequests();
    }, [])
  );

  const fetchAgentRequests = async () => {
    try {
      setError(null);
      const [requestsResponse, statsResponse] = await Promise.all([
        apiService.getAgentRequests(),
        apiService.getAgentStats(),
      ]);
      setRequests(requestsResponse);
      setFilteredRequests(requestsResponse);
      setStats(statsResponse);
    } catch (err: any) {
      console.error('Fetch agent requests error:', err);
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgentRequests();
  };

  // Filter requests based on search and status
  useEffect(() => {
    let filtered = requests;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(request =>
        request.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.host?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(request => request.status === selectedStatus);
    }

    setFilteredRequests(filtered);
  }, [requests, searchQuery, selectedStatus]);

  const handleRequestPress = (request: CheckInRequest) => {
    navigation.navigate('RequestDetails', { requestId: request.id });
  };

  const handleCompleteRequest = async (requestId: string) => {
    try {
      await apiService.completeCheckInRequest(requestId);
      await fetchAgentRequests(); // Refresh data
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

  const renderRequestItem = ({ item }: { item: CheckInRequest }) => (
    <Pressable onPress={() => handleRequestPress(item)} mb={3}>
      <Card>
        <VStack space={3} p={4}>
          {/* Header with Status */}
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="sm" color="gray.500">
              {formatDate(item.checkInTime)}
            </Text>
            <Badge
              colorScheme={getStatusColor(item.status)}
              variant="solid"
              leftIcon={<Icon as={MaterialIcons} name={getStatusIcon(item.status)} size="xs" />}
            >
              {formatStatusText(item.status)}
            </Badge>
          </HStack>

          {/* Property Address */}
          <VStack space={1}>
            <Text fontWeight="medium" fontSize="md" numberOfLines={2}>
              {item.propertyAddress}
            </Text>
            <Text color="gray.600" fontSize="sm">
              Guest: {item.guestName} ({item.guestCount} guest{item.guestCount !== 1 ? 's' : ''})
            </Text>
          </VStack>

          {/* Host Information */}
          {item.host && (
            <HStack space={3} alignItems="center">
              <Avatar bg="primary.500" size="sm">
                <Icon as={MaterialIcons} name="person" color="white" size="sm" />
              </Avatar>
              <VStack>
                <Text fontSize="sm" fontWeight="medium">
                  {item.host.name}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Host
                </Text>
              </VStack>
            </HStack>
          )}

          {/* Footer with Payout and Action */}
          <HStack justifyContent="space-between" alignItems="center">
            <VStack>
              <Text fontSize="sm" color="gray.600">
                {item.status === 'completed' ? 'Earned' : 'Will Earn'}
              </Text>
              <Text fontWeight="bold" color="green.600">
                {formatCurrency(item.agentPayout)}
              </Text>
            </VStack>

            {item.status === 'in_progress' && (
              <Button
                size="sm"
                colorScheme="green"
                onPress={() => handleCompleteRequest(item.id)}
                leftIcon={<Icon as={MaterialIcons} name="done" size="xs" />}
              >
                Complete
              </Button>
            )}

            {item.status === 'accepted' && (
              <Button
                size="sm"
                colorScheme="blue"
                onPress={() => navigation.navigate('DocumentUpload', { requestId: item.id })}
                leftIcon={<Icon as={MaterialIcons} name="upload-file" size="xs" />}
              >
                Upload Docs
              </Button>
            )}
          </HStack>
        </VStack>
      </Card>
    </Pressable>
  );

  const renderEmptyState = () => (
    <Center flex={1} p={6}>
      <Icon as={MaterialIcons} name="work-outline" size={20} color="gray.400" mb={4} />
      <Heading size="md" color="gray.600" textAlign="center" mb={2}>
        No Requests Found
      </Heading>
      <Text color="gray.500" textAlign="center" mb={6}>
        {requests.length === 0 
          ? "You haven't accepted any check-in requests yet. Check the map for nearby opportunities!"
          : "No requests match your current filters."
        }
      </Text>
      {requests.length === 0 && (
        <Button 
          onPress={() => navigation.getParent()?.navigate('Map')} 
          colorScheme="green"
        >
          Find Requests
        </Button>
      )}
    </Center>
  );

  if (loading) {
    return (
      <Box flex={1} bg="gray.50">
        <Center flex={1}>
          <Spinner size="lg" color="green.500" />
          <Text mt={4} color="gray.600">Loading your requests...</Text>
        </Center>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="gray.50">
      {/* Header with Stats */}
      <Box bg="green.500" pt={12} pb={4} px={4}>
        <VStack space={4}>
          <Heading color="white" size="lg">
            My Requests
          </Heading>

          {/* Agent Stats */}
          <HStack space={4} justifyContent="space-around">
            <VStack alignItems="center">
              <Text color="white" opacity={0.8} fontSize="sm">
                Completed
              </Text>
              <Text color="white" fontWeight="bold" fontSize="lg">
                {stats.completedRequests}
              </Text>
            </VStack>
            
            <VStack alignItems="center">
              <Text color="white" opacity={0.8} fontSize="sm">
                Total Earned
              </Text>
              <Text color="white" fontWeight="bold" fontSize="lg">
                {formatCurrency(stats.totalEarned)}
              </Text>
            </VStack>
            
            <VStack alignItems="center">
              <Text color="white" opacity={0.8} fontSize="sm">
                Rating
              </Text>
              <HStack alignItems="center" space={1}>
                <Icon as={MaterialIcons} name="star" color="yellow.300" size="sm" />
                <Text color="white" fontWeight="bold" fontSize="lg">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                </Text>
              </HStack>
            </VStack>
          </HStack>

          {/* Search and Filter */}
          <VStack space={3}>
            <Input
              placeholder="Search by property, guest, or host..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              bg="white"
              borderRadius="lg"
              InputLeftElement={
                <Icon as={MaterialIcons} name="search" size="sm" ml={3} color="gray.400" />
              }
            />

            <Select
              selectedValue={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as CheckInStatus | 'all')}
              bg="white"
              borderRadius="lg"
              placeholder="Filter by status"
            >
              <Select.Item label="All Statuses" value="all" />
              <Select.Item label="Accepted" value="accepted" />
              <Select.Item label="In Progress" value="in_progress" />
              <Select.Item label="Completed" value="completed" />
              <Select.Item label="Cancelled" value="cancelled_agent" />
            </Select>
          </VStack>
        </VStack>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert status="error" mx={4} mt={4} borderRadius="lg">
          <Alert.Icon />
          <Text color="error.600">{error}</Text>
        </Alert>
      )}

      {/* Requests List */}
      <Box flex={1}>
        {filteredRequests.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredRequests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </Box>
    </Box>
  );
}
