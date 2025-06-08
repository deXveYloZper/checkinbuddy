import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  ScrollView,
  Button,
  Image,
  Pressable,
  Icon,
  Center,
  Spinner,
  Alert,
  Badge,
  useTheme,
  Modal,
  Progress,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Dimensions, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import apiService from '../../services/api';
import { Document as DocType } from '../../types';
import type { AppStackNavigationProp, SharedStackRouteProp } from '../../types';

const { width } = Dimensions.get('window');

interface UploadedDocument {
  id?: string;
  uri: string;
  name: string;
  type: string;
  size: number;
  uploaded: boolean;
  uploading?: boolean;
  progress?: number;
}

export default function DocumentUploadScreen() {
  const navigation = useNavigation<AppStackNavigationProp>();
  const route = useRoute<SharedStackRouteProp<'DocumentUpload'>>();
  const theme = useTheme();
  
  const { requestId } = route.params;

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<DocType[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    setLoading(true);
    await requestCameraPermission();
    await loadExistingDocuments();
    setLoading(false);
  };

  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
      
      if (status !== 'granted') {
        setError('Camera permission is required');
      }
    } catch (err) {
      console.error('Camera permission error:', err);
      setError('Failed to request camera permission');
    }
  };

  const loadExistingDocuments = async () => {
    try {
      const docs = await apiService.getDocuments(requestId);
      setExistingDocuments(docs);
    } catch (err: any) {
      console.error('Load documents error:', err);
      // Don't show error for this as it might be normal (no documents yet)
    }
  };

  const takePicture = async () => {
    if (!cameraPermission) {
      setError('Camera permission is required');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Compress and optimize image
        const optimizedImage = await manipulateAsync(
          asset.uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.8, format: SaveFormat.JPEG }
        );

        const document: UploadedDocument = {
          uri: optimizedImage.uri,
          name: `document_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize || 0,
          uploaded: false,
        };

        setDocuments(prev => [...prev, document]);
      }
    } catch (err: any) {
      console.error('Take picture error:', err);
      setError('Failed to take picture');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const document: UploadedDocument = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
          uploaded: false,
        };

        setDocuments(prev => [...prev, document]);
      }
    } catch (err: any) {
      console.error('Pick document error:', err);
      setError('Failed to pick document');
    }
  };

  const uploadDocument = async (document: UploadedDocument, index: number) => {
    try {
      // Update document as uploading
      setDocuments(prev => prev.map((doc, i) => 
        i === index ? { ...doc, uploading: true, progress: 0 } : doc
      ));

      // Get pre-signed upload URL
      const { uploadUrl, fileKey } = await apiService.getUploadUrl(
        requestId,
        document.name,
        document.type
      );

      // Prepare file for upload
      const fileUri = Platform.OS === 'ios' ? document.uri.replace('file://', '') : document.uri;
      const file = {
        uri: fileUri,
        type: document.type,
        name: document.name,
      };

      // Upload to S3
      await apiService.uploadDocument(uploadUrl, file);

      // Update document as uploaded
      setDocuments(prev => prev.map((doc, i) => 
        i === index ? { ...doc, uploaded: true, uploading: false, progress: 100 } : doc
      ));

      // Refresh existing documents list
      await loadExistingDocuments();

    } catch (err: any) {
      console.error('Upload document error:', err);
      setError(`Failed to upload ${document.name}`);
      
      // Update document as failed
      setDocuments(prev => prev.map((doc, i) => 
        i === index ? { ...doc, uploading: false, progress: 0 } : doc
      ));
    }
  };

  const uploadAllDocuments = async () => {
    setUploading(true);
    setError(null);

    const pendingDocuments = documents.filter(doc => !doc.uploaded);
    
    if (pendingDocuments.length === 0) {
      setError('No documents to upload');
      setUploading(false);
      return;
    }

    try {
      // Upload documents sequentially to avoid overwhelming the API
      for (let i = 0; i < documents.length; i++) {
        const document = documents[i];
        if (!document.uploaded) {
          await uploadDocument(document, i);
        }
      }

      // Check if all documents are uploaded
      const allUploaded = documents.every(doc => doc.uploaded);
      if (allUploaded) {
        // Navigate back with success
        navigation.goBack();
      }
    } catch (err: any) {
      console.error('Upload all documents error:', err);
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const viewImage = (uri: string) => {
    setSelectedImageUri(uri);
    setShowImageModal(true);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return 'image';
    } else if (type === 'application/pdf') {
      return 'picture-as-pdf';
    }
    return 'description';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Box flex={1} bg="gray.50">
        <Center flex={1}>
          <Spinner size="lg" color="primary.500" />
          <Text mt={4} color="gray.600">Loading...</Text>
        </Center>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="gray.50">
      {/* Header */}
      <Box bg="primary.500" pt={12} pb={4} px={4}>
        <HStack alignItems="center" space={3}>
          <Pressable onPress={() => navigation.goBack()}>
            <Icon as={MaterialIcons} name="arrow-back" size="lg" color="white" />
          </Pressable>
          <VStack flex={1}>
            <Heading color="white" size="lg">
              Upload Documents
            </Heading>
            <Text color="white" opacity={0.9} fontSize="sm">
              Capture guest ID and verification documents
            </Text>
          </VStack>
        </HStack>
      </Box>

      <ScrollView flex={1} contentContainerStyle={{ paddingBottom: 120 }}>
        <VStack space={6} p={4}>
          {/* Error Alert */}
          {error && (
            <Alert status="error">
              <Alert.Icon />
              <Text>{error}</Text>
            </Alert>
          )}

          {/* Instructions */}
          <Box bg="blue.50" rounded="lg" p={4} borderWidth={1} borderColor="blue.200">
            <HStack alignItems="flex-start" space={3}>
              <Icon as={MaterialIcons} name="info" size="sm" color="blue.600" mt={0.5} />
              <VStack flex={1} space={1}>
                <Text fontWeight="bold" color="blue.800">
                  Document Requirements
                </Text>
                <Text fontSize="sm" color="blue.700">
                  • Capture clear photos of guest ID documents
                </Text>
                <Text fontSize="sm" color="blue.700">
                  • Ensure all text is readable and borders are visible
                </Text>
                <Text fontSize="sm" color="blue.700">
                  • Documents will be automatically deleted after 48 hours
                </Text>
              </VStack>
            </HStack>
          </Box>

          {/* Action Buttons */}
          <VStack space={3}>
            <Heading size="sm" color="gray.700">
              Add Documents
            </Heading>
            
            <HStack space={3}>
              <Button
                flex={1}
                leftIcon={<Icon as={MaterialIcons} name="camera-alt" size="sm" color="white" />}
                onPress={takePicture}
                isDisabled={!cameraPermission}
                bg="primary.500"
              >
                Camera
              </Button>
              
              <Button
                flex={1}
                leftIcon={<Icon as={MaterialIcons} name="folder" size="sm" color="primary.600" />}
                variant="outline"
                borderColor="primary.500"
                _text={{ color: 'primary.600' }}
                onPress={pickDocument}
              >
                Gallery
              </Button>
            </HStack>
          </VStack>

          {/* Existing Documents */}
          {existingDocuments.length > 0 && (
            <VStack space={3}>
              <HStack justifyContent="space-between" alignItems="center">
                <Heading size="sm" color="gray.700">
                  Uploaded Documents
                </Heading>
                <Badge colorScheme="green" rounded="md">
                  {existingDocuments.length} uploaded
                </Badge>
              </HStack>
              
              <VStack space={2}>
                {existingDocuments.map((doc) => (
                  <Box key={doc.id} bg="white" rounded="lg" p={3} shadow={1}>
                    <HStack alignItems="center" space={3}>
                      <Icon
                        as={MaterialIcons}
                        name={getFileIcon(doc.fileType)}
                        size="md"
                        color="green.600"
                      />
                      <VStack flex={1}>
                        <Text fontWeight="medium" color="gray.800">
                          {doc.fileName}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Uploaded • Expires in 48h
                        </Text>
                      </VStack>
                      <Badge colorScheme="green" size="sm">
                        ✓
                      </Badge>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </VStack>
          )}

          {/* New Documents */}
          {documents.length > 0 && (
            <VStack space={3}>
              <HStack justifyContent="space-between" alignItems="center">
                <Heading size="sm" color="gray.700">
                  New Documents
                </Heading>
                <Badge colorScheme="orange" rounded="md">
                  {documents.filter(d => !d.uploaded).length} pending
                </Badge>
              </HStack>
              
              <VStack space={2}>
                {documents.map((doc, index) => (
                  <Box key={index} bg="white" rounded="lg" p={3} shadow={1}>
                    <VStack space={3}>
                      <HStack alignItems="center" space={3}>
                        {doc.type.startsWith('image/') ? (
                          <Pressable onPress={() => viewImage(doc.uri)}>
                            <Image
                              source={{ uri: doc.uri }}
                              alt="Document preview"
                              size="md"
                              rounded="md"
                            />
                          </Pressable>
                        ) : (
                          <Icon
                            as={MaterialIcons}
                            name={getFileIcon(doc.type)}
                            size="md"
                            color="gray.600"
                          />
                        )}
                        
                        <VStack flex={1}>
                          <Text fontWeight="medium" color="gray.800" numberOfLines={1}>
                            {doc.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {formatFileSize(doc.size)}
                          </Text>
                        </VStack>
                        
                        <HStack alignItems="center" space={2}>
                          {doc.uploading ? (
                            <Spinner size="sm" color="primary.500" />
                          ) : doc.uploaded ? (
                            <Badge colorScheme="green" size="sm">
                              ✓
                            </Badge>
                          ) : (
                            <Pressable onPress={() => removeDocument(index)}>
                              <Icon as={MaterialIcons} name="close" size="sm" color="red.500" />
                            </Pressable>
                          )}
                        </HStack>
                      </HStack>
                      
                      {doc.uploading && (
                        <Progress
                          value={doc.progress || 0}
                          colorScheme="primary"
                          bg="gray.200"
                          size="sm"
                        />
                      )}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </VStack>
          )}

          {/* Empty State */}
          {documents.length === 0 && existingDocuments.length === 0 && (
            <Center py={10}>
              <Icon
                as={MaterialIcons}
                name="camera-alt"
                size={16}
                color="gray.400"
                mb={4}
              />
              <Text color="gray.600" textAlign="center" fontSize="lg" mb={2}>
                No documents yet
              </Text>
              <Text color="gray.500" textAlign="center" fontSize="sm">
                Use the camera or gallery to add guest documents
              </Text>
            </Center>
          )}
        </VStack>
      </ScrollView>

      {/* Bottom Actions */}
      {documents.length > 0 && (
        <Box bg="white" p={4} shadow={3}>
          <Button
            bg="primary.500"
            onPress={uploadAllDocuments}
            isLoading={uploading}
            isDisabled={uploading || documents.every(d => d.uploaded)}
            leftIcon={<Icon as={MaterialIcons} name="cloud-upload" size="sm" color="white" />}
          >
            Upload All Documents ({documents.filter(d => !d.uploaded).length})
          </Button>
        </Box>
      )}

      {/* Image Preview Modal */}
      <Modal isOpen={showImageModal} onClose={() => setShowImageModal(false)} size="full">
        <Modal.Content bg="black">
          <Modal.CloseButton />
          <Modal.Body p={0}>
            {selectedImageUri && (
              <Center flex={1}>
                <Image
                  source={{ uri: selectedImageUri }}
                  alt="Document preview"
                  resizeMode="contain"
                  style={{ width: width, height: '100%' }}
                />
              </Center>
            )}
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </Box>
  );
}
