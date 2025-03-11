// tests/integration.test.ts
import { getAccountInfo, getAccountHistory } from '../src/tools/account';
import { getChainProperties } from '../src/tools/blockchain';
import { signMessage, verifySignature } from '../src/tools/crypto';
import { successJson, errorResponse } from '../src/utils/response';
import { canRunAuthenticatedTests, getTestUsername } from './utils/test-helpers';

// Helper function to check if we can run authenticated tests
function integrationCanRunAuthTests() {
  return Boolean(process.env.HIVE_USERNAME);
}

describe('Integration Tests', () => {
  // Skip all tests if we can't run authenticated tests
  const maybeDescribe = integrationCanRunAuthTests() ? describe : describe.skip;
  
  // Test that blockchain properties and account info can be combined
  describe('Blockchain and Account Info', () => {
    it('should fetch blockchain properties and account information', async () => {
      // Get blockchain properties
      const propsResult = await getChainProperties({});
      expect(propsResult.isError).toBeUndefined();
      
      const chainData = JSON.parse(propsResult.content[0].text);
      expect(chainData.dynamic_properties).toBeDefined();
      
      // Get account information for test account
      const testUsername = getTestUsername();
      const accountResult = await getAccountInfo({ username: testUsername });
      expect(accountResult.isError).toBeUndefined();
      
      const accountData = JSON.parse(accountResult.content[0].text);
      expect(accountData.name).toBe(testUsername);
      
      // Verify that chainData and accountData can be combined
      // This is a simple check, but it verifies that the data structures
      // returned by different tools are compatible
      const combinedData = {
        account: accountData,
        blockchain: {
          properties: chainData.chain_properties,
          dynamic_properties: chainData.dynamic_properties
        }
      };
      
      // The combined data should be JSON serializable
      const serialized = JSON.stringify(combinedData);
      expect(serialized).toBeDefined();
      
      // Parsing it back should give us the same data
      const parsed = JSON.parse(serialized);
      expect(parsed.account.name).toBe(testUsername);
      expect(parsed.blockchain.properties).toEqual(chainData.chain_properties);
    });
  });
  
  // Test that signing and verification work together properly
  maybeDescribe('Crypto operations flow', () => {
    it('should complete a full sign-verify cycle', async () => {
      // Only run if posting key is available
      if (!process.env.HIVE_POSTING_KEY) {
        return;
      }
      
      // Create a test message
      const testMessage = 'Integration test message ' + new Date().toISOString();
      
      // Sign the message
      const signResult = await signMessage({
        message: testMessage,
        key_type: 'posting'
      });
      
      expect(signResult.isError).toBeUndefined();
      const signData = JSON.parse(signResult.content[0].text);
      
      // Verify the signature
      const verifyResult = await verifySignature({
        message_hash: signData.message_hash,
        signature: signData.signature,
        public_key: signData.public_key
      });
      
      expect(verifyResult.isError).toBeUndefined();
      const verifyData = JSON.parse(verifyResult.content[0].text);
      expect(verifyData.is_valid).toBe(true);
    });
  });
  
  // Test for proper response formatting throughout the API
  describe('Response formatting', () => {
    it('should format all tool responses correctly', async () => {
      // Run a few different tools and verify response format consistency
      const testUsername = getTestUsername();
      
      // Get account info
      const accountResult = await getAccountInfo({ username: testUsername });
      expect(accountResult.content).toBeInstanceOf(Array);
      expect(accountResult.content[0].type).toBe('text');
      expect(accountResult.content[0].mimeType).toBe('application/json');
      
      // Get blockchain properties
      const propsResult = await getChainProperties({});
      expect(propsResult.content).toBeInstanceOf(Array);
      expect(propsResult.content[0].type).toBe('text');
      expect(propsResult.content[0].mimeType).toBe('application/json');
      
      // Test creating responses directly
      const testData = { test: true, value: 123 };
      const customResponse = successJson(testData);
      expect(customResponse.content).toBeInstanceOf(Array);
      expect(customResponse.content[0].type).toBe('text');
      expect(customResponse.content[0].mimeType).toBe('application/json');
      
      const parsedCustom = JSON.parse(customResponse.content[0].text);
      expect(parsedCustom).toEqual(testData);
      
      // Test error response
      const errorMsg = 'Test error message';
      const errResponse = errorResponse(errorMsg);
      expect(errResponse.isError).toBe(true);
      expect(errResponse.content[0].text).toBe(errorMsg);
    });
  });
});
