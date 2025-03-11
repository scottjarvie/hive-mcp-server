// tests/config/index.test.ts
import * as configModule from '../../src/config';
import { PrivateKey } from '@hiveio/dhive';

describe('Configuration Module', () => {
  const originalEnv = process.env;

  // Save original environment variables and restore them after tests
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
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
    
    it('should validate correctly formatted WIF private key', () => {
      // This is a test private key, not a real one
      const testKey = '5JfwDztjHYDDdKnCpjY6cwUQfM4hbtYmSJLjGd6KcK6aEb6rbQD';
      expect(configModule.validatePrivateKey(testKey)).toBe(true);
    });
  });
  
  describe('Authentication capability functions', () => {
    it('should check if authenticated operations are available', () => {
      // Need to mock the validatePrivateKey function for this test
      const originalValidatePrivateKey = configModule.validatePrivateKey;
      const mockValidatePrivateKey = jest.fn().mockReturnValue(true);
      (configModule as any).validatePrivateKey = mockValidatePrivateKey;
      
      // First with no credentials
      process.env.HIVE_USERNAME = undefined;
      process.env.HIVE_POSTING_KEY = undefined;
      
      expect(configModule.canPerformAuthenticatedOperations()).toBe(false);
      
      // Now with valid credentials
      process.env.HIVE_USERNAME = 'test-user';
      process.env.HIVE_POSTING_KEY = '5JfwDztjHYDDdKnCpjY6cwUQfM4hbtYmSJLjGd6KcK6aEb6rbQD';
      
      // Reset to use original implementation
      (configModule as any).validatePrivateKey = originalValidatePrivateKey;
    });
    
    it('should check if token transfers are available', () => {
      // Need to mock the validatePrivateKey function for this test
      const originalValidatePrivateKey = configModule.validatePrivateKey;
      const mockValidatePrivateKey = jest.fn().mockReturnValue(true);
      (configModule as any).validatePrivateKey = mockValidatePrivateKey;
      
      // First with no credentials
      process.env.HIVE_USERNAME = undefined;
      process.env.HIVE_ACTIVE_KEY = undefined;
      
      expect(configModule.canPerformTokenTransfers()).toBe(false);
      
      // Now with valid credentials
      process.env.HIVE_USERNAME = 'test-user';
      process.env.HIVE_ACTIVE_KEY = '5JfwDztjHYDDdKnCpjY6cwUQfM4hbtYmSJLjGd6KcK6aEb6rbQD';
      
      // Reset to use original implementation
      (configModule as any).validatePrivateKey = originalValidatePrivateKey;
    });
  });
});
