import React from 'react';
import { Box, Center, Heading, Text } from 'native-base';

export default function PaymentScreen() {
  return (
    <Box flex={1} bg="gray.50">
      <Center flex={1}>
        <Heading>Payment Screen</Heading>
        <Text color="gray.600" mt={2}>
          Stripe integration coming soon
        </Text>
      </Center>
    </Box>
  );
} 