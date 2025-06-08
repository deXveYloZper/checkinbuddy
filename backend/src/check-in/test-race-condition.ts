import { CheckInService } from './check-in.service';
import { CheckInRequest } from './entities/check-in-request.entity';

/**
 * Test script to demonstrate race condition prevention in acceptRequest method
 * 
 * This script simulates multiple agents trying to accept the same request simultaneously
 * and shows how the atomic update with WHERE clause prevents race conditions.
 */

// Mock function to simulate concurrent requests
async function simulateRaceCondition(checkInService: CheckInService, requestId: string) {
  const agentIds = ['agent-1', 'agent-2', 'agent-3'];
  const promises = agentIds.map(agentId => 
    checkInService.acceptRequest(requestId, agentId)
  );

  try {
    const results = await Promise.allSettled(promises);
    
    console.log('Race condition test results:');
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ Agent ${agentIds[index]} successfully accepted the request`);
      } else {
        console.log(`❌ Agent ${agentIds[index]} failed: ${result.reason.message}`);
      }
    });

    // Count successful acceptances
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`\n📊 Results: ${successCount} agent(s) successfully accepted the request`);
    
    if (successCount === 1) {
      console.log('✅ Race condition prevented! Only one agent accepted the request.');
    } else if (successCount > 1) {
      console.log('❌ Race condition detected! Multiple agents accepted the same request.');
    } else {
      console.log('⚠️ No agents could accept the request (may already be taken or invalid).');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

/**
 * Example usage:
 * 
 * const checkInService = new CheckInService(repository, configService);
 * await simulateRaceCondition(checkInService, 'request-uuid-here');
 */

export { simulateRaceCondition }; 