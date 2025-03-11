// tests/tools/crypto.test.ts
import { PrivateKey, cryptoUtils } from '@hiveio/dhive';
import { signMessage, verifySignature } from '../../src/tools/crypto';
import { canRunAuthenticatedTests } from '../utils/test-helpers';

describe('Crypto Tools', () => {
  // Skip all tests if we can't run authenticated tests
  const maybeDescribe = canRunAuthenticatedTests() ? describe : describe.skip;
  
  maybeDescribe('signMessage and verifySignature', () => {
    it('should sign a message and verify the signature', async () => {
      // Only run test if posting key is available
      if (!process.env.HIVE_POSTING_KEY) {
        return;
      }
      
      // Arrange
      const testMessage = 'This is a test message for signature verification';
      
      // Act - Sign the message
      const signResult = await signMessage({ 
        message: testMessage, 
        key_type: 'posting'
      });
      
      // Assert signature result
      expect(signResult).toBeDefined();
      expect(signResult.isError).toBeUndefined();
      
      const signData = JSON.parse(signResult.content[0].text);
      expect(signData.success).toBe(true);
      expect(signData.signature).toBeDefined();
      expect(signData.public_key).toBeDefined();
      expect(signData.message_hash).toBeDefined();
      
      // Now verify the signature
      const verifyResult = await verifySignature({
        message_hash: signData.message_hash,
        signature: signData.signature,
        public_key: signData.public_key
      });
      
      // Assert verification result
      expect(verifyResult).toBeDefined();
      expect(verifyResult.isError).toBeUndefined();
      
      const verifyData = JSON.parse(verifyResult.content[0].text);
      expect(verifyData.success).toBe(true);
      expect(verifyData.is_valid).toBe(true);
    });
    
    it('should return error for invalid signature', async () => {
      // Only run test if posting key is available
      if (!process.env.HIVE_POSTING_KEY) {
        return;
      }
      
      // Generate a message hash
      const testMessage = 'Test message';
      const messageHash = cryptoUtils.sha256(testMessage).toString('hex');
      
      // Create an invalid signature
      const invalidSignature = 'SIG_K1_INVALID_SIGNATURE_FOR_TESTING';
      
      // Generate a test public key
      const tempPrivateKey = PrivateKey.fromSeed('test');
      const publicKey = tempPrivateKey.createPublic().toString();
      
      // Act - Verify with invalid signature
      const verifyResult = await verifySignature({
        message_hash: messageHash,
        signature: invalidSignature,
        public_key: publicKey
      });
      
      // Assert verification result shows error
      expect(verifyResult).toBeDefined();
      expect(verifyResult.isError).toBe(true);
      expect(verifyResult.content[0].text).toContain('Error');
    });
  });
  
  // Test for error handling when environment variables are not set
  describe('Environment variable handling', () => {
    const originalEnv = process.env;
    
    // Save environment variables
    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });
    
    // Restore environment variables after tests
    afterAll(() => {
      process.env = originalEnv;
    });
    
    it('should handle missing private keys gracefully', async () => {
      // Temporarily remove HIVE_POSTING_KEY
      const originalPostingKey = process.env.HIVE_POSTING_KEY;
      process.env.HIVE_POSTING_KEY = undefined;
      
      // Try to sign a message without a posting key
      const signResult = await signMessage({
        message: 'Test message',
        key_type: 'posting'
      });
      
      // Should return error about missing environment variable
      expect(signResult).toBeDefined();
      expect(signResult.isError).toBe(true);
      expect(signResult.content[0].text).toContain('HIVE_POSTING_KEY');
      
      // Restore the original value
      process.env.HIVE_POSTING_KEY = originalPostingKey;
    });
  });
});
