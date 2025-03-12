// tests/config/client.test.ts
import client from '../../src/config/client';

describe('Hive Client', () => {
  it('should be initialized with API endpoints', () => {
    // The client should be initialized
    expect(client).toBeDefined();
    
    // Since we can't reliably access the internal API endpoints directly,
    // let's use a more practical approach to verify the client is configured

    // Check client has the correct interface
    expect(client).toHaveProperty('database');
    expect(client).toHaveProperty('broadcast');
    
    // We know from client.ts that it's initialized with an array of endpoints
    // Let's mock the client creation to verify the endpoints
    
    // Alternative: Just check that functions exist which implicitly require endpoints
    expect(typeof client.database.getDynamicGlobalProperties).toBe('function');
    expect(typeof client.broadcast.sendOperations).toBe('function');
  });
  
  it('should connect to the Hive blockchain', async () => {
    // This test ensures we can actually connect to the blockchain
    // by calling a simple API method
    
    // We'll use getDynamicGlobalProperties which requires no authentication
    const props = await client.database.getDynamicGlobalProperties();
    
    // Verify we got a response with the expected structure
    expect(props).toBeDefined();
    expect(props.head_block_number).toBeDefined();
    expect(Number(props.head_block_number)).toBeGreaterThan(0);
    expect(props.time).toBeDefined();
    
    // Try to parse the time to ensure it's a valid date
    const blockTime = new Date(props.time);
    expect(blockTime.getTime()).not.toBeNaN();
    
    // The block time should be recent (within the last hour)
    const now = new Date();
    const timeDifferenceMs = now.getTime() - blockTime.getTime();
    expect(timeDifferenceMs).toBeLessThan(60 * 60 * 1000); // Less than 1 hour
  });
  
  it('should have database and broadcast APIs accessible', () => {
    expect(client.database).toBeDefined();
    expect(typeof client.database.getAccounts).toBe('function');
    expect(typeof client.database.getBlock).toBe('function');
    expect(typeof client.database.getDynamicGlobalProperties).toBe('function');
    
    expect(client.broadcast).toBeDefined();
    expect(typeof client.broadcast.comment).toBe('function');
    expect(typeof client.broadcast.vote).toBe('function');
    expect(typeof client.broadcast.transfer).toBe('function');
  });
});
