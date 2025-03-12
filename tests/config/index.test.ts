// tests/config/index.test.ts
import * as configModule from '../../src/config';
import { PrivateKey } from '@hiveio/dhive';

// Helper function to check if environment variables exist
const hasEnv = (vars: string[]): boolean => 
  vars.every(varName => !!process.env[varName]);

describe('Configuration Module', () => {
  const originalEnv = process.env;

  // Save original environment variables and restore them after tests
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Refresh the config with the current environment
    configModule.refreshEnvConfig();
  });

  afterEach(() => {
    // Restore any mocks
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Configuration Structure', () => {
    it('should have the expected structure', () => {
      expect(configModule).toBeDefined();
      expect(configModule.default).toBeDefined();
      const config = configModule.default;
      
      expect(config.hive).toBeDefined();
      expect(config.server).toBeDefined();
      expect(config.log).toBeDefined();
      
      // Server config
      expect(config.server.name).toBeDefined();
      expect(config.server.version).toBeDefined();
      
      // Log config
      expect(config.log.logLevel).toBeDefined();
      expect(['debug', 'info', 'warn', 'error']).toContain(config.log.logLevel);
    });
    
    it('should read environment variables for Hive credentials', () => {
      const config = configModule.default;
      // The values in config should match the environment variables
      expect(config.hive.username).toBe(process.env.HIVE_USERNAME);
      expect(config.hive.postingKey).toBe(process.env.HIVE_POSTING_KEY);
      expect(config.hive.activeKey).toBe(process.env.HIVE_ACTIVE_KEY);
      expect(config.hive.memoKey).toBe(process.env.HIVE_MEMO_KEY);
    });
  });
  
  describe('getConfig function', () => {
    it('should return the current configuration', () => {
      const currentConfig = configModule.getConfig();
      expect(currentConfig).toEqual(configModule.default);
    });
  });
  
  describe('validatePrivateKey function', () => {
    it('should return false for undefined keys', () => {
      expect(configModule.validatePrivateKey(undefined)).toBe(false);
    });
    
    it('should return false for invalid key formats', () => {
      expect(configModule.validatePrivateKey('invalid-key')).toBe(false);
      expect(configModule.validatePrivateKey('12345')).toBe(false);
      expect(configModule.validatePrivateKey('NOT_A_VALID_KEY')).toBe(false);
    });
    
    // Only run this test if TEST_PRIVATE_KEY is available
    (process.env.TEST_PRIVATE_KEY ? it : it.skip)('should validate correctly formatted WIF private key', () => {
      const testKey = process.env.TEST_PRIVATE_KEY;
      expect(configModule.validatePrivateKey(testKey)).toBe(true);
    });
  });
  
  describe('Authentication capability functions', () => {
    // Only run this test if required env vars are available or conditionally run part of it
    (hasEnv(['HIVE_USERNAME']) ? it : it.skip)('should check if authenticated operations are available', () => {
      // First with no credentials - directly modify the environment
      const username = process.env.HIVE_USERNAME;
      const postingKey = process.env.HIVE_POSTING_KEY;
      
      // Delete the environment variables
      delete process.env.HIVE_USERNAME;
      delete process.env.HIVE_POSTING_KEY;
      configModule.refreshEnvConfig();
      
      // Test with no credentials
      expect(configModule.canPerformAuthenticatedOperations()).toBe(false);
      
      // Restore environment variables if they existed
      if (username) process.env.HIVE_USERNAME = username;
      if (postingKey) process.env.HIVE_POSTING_KEY = postingKey;
      configModule.refreshEnvConfig();
      
      // Test with credentials if available
      if (username && postingKey && configModule.validatePrivateKey(postingKey)) {
        expect(configModule.canPerformAuthenticatedOperations()).toBe(true);
      }
    });
    
    (hasEnv(['HIVE_USERNAME']) ? it : it.skip)('should check if token transfers are available', () => {
      // First with no credentials - directly modify the environment
      const username = process.env.HIVE_USERNAME;
      const activeKey = process.env.HIVE_ACTIVE_KEY;
      
      // Delete the environment variables
      delete process.env.HIVE_USERNAME;
      delete process.env.HIVE_ACTIVE_KEY;
      configModule.refreshEnvConfig();
      
      // Test with no credentials
      expect(configModule.canPerformTokenTransfers()).toBe(false);
      
      // Restore environment variables if they existed
      if (username) process.env.HIVE_USERNAME = username;
      if (activeKey) process.env.HIVE_ACTIVE_KEY = activeKey;
      configModule.refreshEnvConfig();
      
      // Test with credentials if available
      if (username && activeKey && configModule.validatePrivateKey(activeKey)) {
        expect(configModule.canPerformTokenTransfers()).toBe(true);
      }
    });
  });
});
