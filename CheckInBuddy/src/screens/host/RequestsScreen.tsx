import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Icon,
  Button,
  Center,
  Spinner,
  Alert,
  Input,
  Menu,
  Pressable,
  Card,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RefreshControl, FlatList } from 'react-native';

import apiService from '../../services/api';
import { CheckInRequest, CheckInStatus } from '../../types';
import type { AppStackNavigationProp } from '../../types';

export default function HostRequestsScreen() {
  const navigation = useNavigation<AppStackNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<CheckInRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CheckInRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CheckInStatus | 'all'>('all');

  // Fetch requests when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchRequests();
    }, [])
  );

  const fetchRequests = async () => {
    try {
      setError(null);
      const response = await apiService.getMyRequests();
      setRequests(response);
      setFilteredRequests(response);
    } catch (err: any) {
      console.error('Fetch requests error:', err);
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  // Filter requests based on search and status
  useEffect(() => {
    let filtered = requests;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(request =>
        request.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.guestName.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleCreateRequest = () => {
    navigation.navigate('CreateRequest');
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

          {/* Footer with Payment and Agent Info */}
          <HStack justifyContent="space-between" alignItems="center">
            <VStack>
              <Text fontSize="sm" color="gray.600">
                Total Paid
              </Text>
              <Text fontWeight="bold" color="primary.600">
                {formatCurrency(item.fee + item.platformFee)}
              </Text>
            </VStack>

            {item.agent && (
              <VStack alignItems="flex-end">
                <Text fontSize="sm" color="gray.600">
                  Agent
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {item.agent.name}
                </Text>
              </VStack>
            )}
          </HStack>
        </VStack>
      </Card>
    </Pressable>
  );

  const renderEmptyState = () => (
    <Center flex={1} p={6}>
      <Icon as={MaterialIcons} name="inbox" size={20} color="gray.400" mb={4} />
      <Heading size="md" color="gray.600" textAlign="center" mb={2}>
        No Requests Found
      </Heading>
      <Text color="gray.500" textAlign="center" mb={6}>
        {requests.length === 0 
          ? "You haven't created any check-in requests yet."
          : "No requests match your current filters."
        }
      </Text>
      {requests.length === 0 && (
        <Button onPress={handleCreateRequest} colorScheme="primary">
          Create Your First Request
        </Button>
      )}
    </Center>
  );

  if (loading) {
    return (
      <Box flex={1} bg="gray.50">
        <Center flex={1}>
          <Spinner size="lg" color="primary.500" />
          <Text mt={4} color="gray.600">Loading your requests...</Text>
        </Center>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="gray.50" safeArea>
      <VStack flex={1} space={4} p={4}>
        {/* Header */}
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="lg">My Requests</Heading>
          <Button
            leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
            onPress={handleCreateRequest}
            colorScheme="primary"
          >
            New Request
          </Button>
        </HStack>

        {/* Search and Filter */}
        <HStack space={2}>
          <Input
            flex={1}
            placeholder="Search by address or guest name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            InputLeftElement={
              <Icon
                as={MaterialIcons}
                name="search"
                size={5}
                ml={2}
                color="gray.400"
              />
            }
          />
          <Menu
            trigger={triggerProps => (
              <Pressable {...triggerProps}>
                <Button
                  variant="outline"
                  leftIcon={<Icon as={MaterialIcons} name="filter-list" size="sm" />}
                >
                  {selectedStatus === 'all' ? 'All' : formatStatusText(selectedStatus)}
                </Button>
              </Pressable>
            )}
          >
            <Menu.Item onPress={() => setSelectedStatus('all')}>
              All
            </Menu.Item>
            <Menu.Item onPress={() => setSelectedStatus(CheckInStatus.PENDING)}>
              {formatStatusText(CheckInStatus.PENDING)}
            </Menu.Item>
            <Menu.Item onPress={() => setSelectedStatus(CheckInStatus.ACCEPTED)}>
              {formatStatusText(CheckInStatus.ACCEPTED)}
            </Menu.Item>
            <Menu.Item onPress={() => setSelectedStatus(CheckInStatus.IN_PROGRESS)}>
              {formatStatusText(CheckInStatus.IN_PROGRESS)}
            </Menu.Item>
            <Menu.Item onPress={() => setSelectedStatus(CheckInStatus.COMPLETED)}>
              {formatStatusText(CheckInStatus.COMPLETED)}
            </Menu.Item>
            <Menu.Item onPress={() => setSelectedStatus(CheckInStatus.CANCELLED_HOST)}>
              {formatStatusText(CheckInStatus.CANCELLED_HOST)}
            </Menu.Item>
            <Menu.Item onPress={() => setSelectedStatus(CheckInStatus.CANCELLED_AGENT)}>
              {formatStatusText(CheckInStatus.CANCELLED_AGENT)}
            </Menu.Item>
            <Menu.Item onPress={() => setSelectedStatus(CheckInStatus.EXPIRED)}>
              {formatStatusText(CheckInStatus.EXPIRED)}
            </Menu.Item>
          </Menu>
        </HStack>

        {/* Error Alert */}
        {error && (
          <Alert status="error" mb={4}>
            <Alert.Icon />
            <Text color="error.600">{error}</Text>
          </Alert>
        )}

        {/* Request List */}
        {loading ? (
          <Center flex={1}>
            <Spinner size="lg" color="primary.500" />
          </Center>
        ) : (
          <FlatList
            data={filteredRequests}
            renderItem={renderRequestItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </VStack>
    </Box>
  );
}
