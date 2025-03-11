/**
 * Tests for Hive client configuration
 * 
 * These tests validate that the client is properly configured
 * and can connect to Hive blockchain nodes
 */

const hiveClient = require('../../src/config/client');

describe('Hive Client', () => {
  it('should be initialized with API endpoints', () => {
    // The client should be initialized
    expect(hiveClient).toBeDefined();
    
    // Get access to the private nodes list through the _client property
    // Note: This is not ideal in production tests, but works for our purpose
    const apiUrls = (hiveClient as any)._client?.options?.apiUrls;
    
    // Check that we have API endpoints configured
    expect(apiUrls).toBeDefined();
    expect(Array.isArray(apiUrls)).toBe(true);
    expect(apiUrls.length).toBeGreaterThan(0);
    
    // Verify that the URLs have the expected format
    apiUrls.forEach((url: string) => {
      expect(url).toMatch(/^https?:\/\//); // Should start with http:// or https://
    });
  });
  
  it('should connect to the Hive blockchain', async () => {
    // This test ensures we can actually connect to the blockchain
    // by calling a simple API method
    
    // We'll use getDynamicGlobalProperties which requires no authentication
    const props = await hiveClient.database.getDynamicGlobalProperties();
    
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
    expect(hiveClient.database).toBeDefined();
    expect(typeof hiveClient.database.getAccounts).toBe('function');
    expect(typeof hiveClient.database.getBlock).toBe('function');
    expect(typeof hiveClient.database.getDynamicGlobalProperties).toBe('function');
    
    expect(hiveClient.broadcast).toBeDefined();
    expect(typeof hiveClient.broadcast.comment).toBe('function');
    expect(typeof hiveClient.broadcast.vote).toBe('function');
    expect(typeof hiveClient.broadcast.transfer).toBe('function');
  });
});
