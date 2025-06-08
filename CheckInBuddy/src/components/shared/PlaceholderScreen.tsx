import React from 'react';
import { Box, Center, Heading, Text } from 'native-base';

interface PlaceholderScreenProps {
  title?: string;
  message?: string;
}

export default function PlaceholderScreen({ 
  title = "Coming Soon", 
  message = "This screen is under development" 
}: PlaceholderScreenProps) {
  return (
    <Box flex={1} bg="gray.50">
      <Center flex={1}>
        <Heading color="primary.600">{title}</Heading>
        <Text color="gray.600" mt={2}>
          {message}
        </Text>
      </Center>
    </Box>
  );
} 