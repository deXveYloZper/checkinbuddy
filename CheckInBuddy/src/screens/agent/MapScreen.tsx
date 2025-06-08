import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Pressable,
  Badge,
  Icon,
  Center,
  Spinner,
  Alert,
  Button,
  Card,
  useTheme,
  Modal,
  Divider,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';

import apiService from '../../services/api';
import { CheckInRequest, CheckInStatus } from '../../types';
import type { AppStackNavigationProp } from '../../types';

const { width, height } = Dimensions.get('window');

interface NearbyRequest extends CheckInRequest {
  distance?: number;
}

export default function MapScreen() {
  const navigation = useNavigation<AppStackNavigationProp>();
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearbyRequests, setNearbyRequests] = useState<NearbyRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<NearbyRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 41.9028, // Default to Rome, Italy
    longitude: 12.4964,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Request location permission and get current location
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required to find nearby requests');
        setLocationPermission(false);
        return false;
      }

      setLocationPermission(true);
      return true;
    } catch (err) {
      console.error('Location permission error:', err);
      setError('Failed to request location permission');
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(coords);
      setMapRegion({
        ...coords,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Update agent location on backend
      await apiService.updateLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      return coords;
    } catch (err) {
      console.error('Get location error:', err);
      setError('Failed to get current location');
      return null;
    }
  };

  const fetchNearbyRequests = async (location?: { latitude: number; longitude: number }) => {
    try {
      setError(null);
      const coords = location || userLocation;
      
      if (!coords) {
        setError('Location is required to find nearby requests');
        return;
      }

      const response = await apiService.getNearbyRequests(
        coords.latitude,
        coords.longitude,
        10 // 10km radius
      );

      setNearbyRequests(response.requests || []);
    } catch (err: any) {
      console.error('Fetch nearby requests error:', err);
      setError(err.message || 'Failed to load nearby requests');
    }
  };

  const initializeMap = async () => {
    setLoading(true);
    
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setLoading(false);
      return;
    }

    const location = await getCurrentLocation();
    if (location) {
      await fetchNearbyRequests(location);
    }
    
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNearbyRequests();
    setRefreshing(false);
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  const getStatusColor = (status: CheckInStatus) => {
    switch (status) {
      case 'pending':
        return '#f97316'; // orange
      case 'accepted':
        return '#3b82f6'; // blue
      case 'in_progress':
        return '#8b5cf6'; // purple
      default:
        return '#6b7280'; // gray
    }
  };

  const getMarkerColor = (status: CheckInStatus) => {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'accepted':
        return 'blue';
      case 'in_progress':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMarkerPress = (request: NearbyRequest) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;

    try {
      await apiService.acceptRequest(selectedRequest.id);
      setShowRequestModal(false);
      setSelectedRequest(null);
      // Refresh the map to update request status
      await onRefresh();
    } catch (err: any) {
      console.error('Accept request error:', err);
      setError(err.message || 'Failed to accept request');
    }
  };

  const handleViewDetails = () => {
    if (selectedRequest) {
      setShowRequestModal(false);
      navigation.navigate('RequestDetails', { requestId: selectedRequest.id });
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      initializeMap();
    }, [])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (userLocation) {
        fetchNearbyRequests();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [userLocation]);

  if (loading) {
    return (
      <Box flex={1} bg="gray.50">
        <Center flex={1}>
          <Spinner size="lg" color="secondary.500" />
          <Text mt={4} color="gray.600">Loading map...</Text>
        </Center>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="gray.50">
      {/* Header */}
      <Box bg="secondary.500" pt={12} pb={4} px={4}>
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Heading color="white" size="lg">
              Nearby Requests
            </Heading>
            <Text color="white" opacity={0.9} fontSize="sm">
              {nearbyRequests.length} requests within 10km
            </Text>
          </VStack>
          <HStack space={2}>
            <Pressable
              onPress={onRefresh}
              bg="white"
              rounded="full"
              p={2}
              opacity={0.9}
            >
              <Icon as={MaterialIcons} name="refresh" size="sm" color="secondary.600" />
            </Pressable>
            <Pressable
              onPress={centerOnUser}
              bg="white"
              rounded="full"
              p={2}
              opacity={0.9}
            >
              <Icon as={MaterialIcons} name="my-location" size="sm" color="secondary.600" />
            </Pressable>
          </HStack>
        </HStack>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert status="error" mx={4} mt={2}>
          <Alert.Icon />
          <Text>{error}</Text>
        </Alert>
      )}

      {/* Map */}
      <Box flex={1}>
        <MapView
          ref={mapRef}
          style={{ width, height: height - 200 }}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={locationPermission}
          showsMyLocationButton={false}
          loadingEnabled={true}
        >
          {/* User Location Marker */}
          {userLocation && (
            <Marker
              coordinate={userLocation}
              title="Your Location"
              description="You are here"
              pinColor="blue"
            />
          )}

          {/* Request Markers */}
          {nearbyRequests.map((request) => (
            <Marker
              key={request.id}
              coordinate={{
                latitude: request.propertyLocation?.latitude || 0,
                longitude: request.propertyLocation?.longitude || 0,
              }}
              title={request.guestName}
              description={`${formatCurrency(request.fee)} - ${formatDate(request.checkInTime)}`}
              pinColor={getMarkerColor(request.status)}
              onPress={() => handleMarkerPress(request)}
            />
          ))}
        </MapView>
      </Box>

      {/* Request Details Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        size="lg"
      >
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>
            <Text fontWeight="bold">Check-in Request</Text>
          </Modal.Header>
          <Modal.Body>
            {selectedRequest && (
              <VStack space={4}>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    {selectedRequest.guestName}
                  </Text>
                  <Badge
                    colorScheme={selectedRequest.status === 'pending' ? 'orange' : 'blue'}
                    rounded="md"
                  >
                    {selectedRequest.status}
                  </Badge>
                </HStack>

                <VStack space={2}>
                  <HStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="location-on" size="sm" color="gray.500" />
                    <Text flex={1} fontSize="sm" color="gray.600">
                      {selectedRequest.propertyAddress}
                    </Text>
                  </HStack>

                  <HStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="schedule" size="sm" color="gray.500" />
                    <Text fontSize="sm" color="gray.600">
                      {formatDate(selectedRequest.checkInTime)}
                    </Text>
                  </HStack>

                  <HStack alignItems="center" space={2}>
                    <Icon as={MaterialIcons} name="people" size="sm" color="gray.500" />
                    <Text fontSize="sm" color="gray.600">
                      {selectedRequest.guestCount} guest{selectedRequest.guestCount > 1 ? 's' : ''}
                    </Text>
                  </HStack>

                  {selectedRequest.distance && (
                    <HStack alignItems="center" space={2}>
                      <Icon as={MaterialIcons} name="near-me" size="sm" color="gray.500" />
                      <Text fontSize="sm" color="gray.600">
                        {formatDistance(selectedRequest.distance)} away
                      </Text>
                    </HStack>
                  )}
                </VStack>

                <Divider />

                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight="bold" color="gray.700">
                    Service Fee
                  </Text>
                  <Text fontSize="xl" fontWeight="bold" color="secondary.600">
                    {formatCurrency(selectedRequest.fee)}
                  </Text>
                </HStack>

                <Text fontSize="sm" color="gray.500">
                  You'll receive {formatCurrency(selectedRequest.fee * 0.8)} after completion
                </Text>
              </VStack>
            )}
          </Modal.Body>
          <Modal.Footer>
            <HStack space={3} flex={1}>
              <Button
                flex={1}
                variant="outline"
                onPress={handleViewDetails}
              >
                View Details
              </Button>
              {selectedRequest?.status === 'pending' && (
                <Button
                  flex={1}
                  bg="secondary.500"
                  onPress={handleAcceptRequest}
                >
                  Accept Request
                </Button>
              )}
            </HStack>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Quick Stats Bar */}
      <Box bg="white" p={3} shadow={2}>
        <HStack justifyContent="space-around" alignItems="center">
          <VStack alignItems="center">
            <Text fontSize="lg" fontWeight="bold" color="secondary.600">
              {nearbyRequests.filter(r => r.status === 'pending').length}
            </Text>
            <Text fontSize="xs" color="gray.600">Available</Text>
          </VStack>
          <VStack alignItems="center">
            <Text fontSize="lg" fontWeight="bold" color="blue.600">
              {nearbyRequests.filter(r => r.status === 'accepted').length}
            </Text>
            <Text fontSize="xs" color="gray.600">Accepted</Text>
          </VStack>
          <VStack alignItems="center">
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              {nearbyRequests.filter(r => r.status === 'completed').length}
            </Text>
            <Text fontSize="xs" color="gray.600">Completed</Text>
          </VStack>
        </HStack>
      </Box>
    </Box>
  );
}
