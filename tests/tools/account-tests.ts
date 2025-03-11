/**
 * Tests for account-related tools
 * 
 * These tests validate the functionality of the account-related tools:
 * - getAccountInfo
 * - getAccountHistory
 * - getVestingDelegations
 */

// const accountTools = require('../../src/tools/account');
const config = require('../../src/config');

// Helper function to check if we can run authenticated tests
function canRunAuthenticatedTests() {
  return Boolean(process.env.HIVE_USERNAME);
}

// Get a test username - either from env vars or a known account
function getTestUsername() {
  return process.env.HIVE_USERNAME || 'helo';
}

describe('Account Tools', () => {
  // Skip all tests if we can't run authenticated tests
  const maybeDescribe = canRunAuthenticatedTests() ? describe : describe.skip;
  
  maybeDescribe('getAccountInfo', () => {
    it('should fetch account information successfully', async () => {
      // Arrange
      const testUsername = getTestUsername();
      
      // Act
      const result = await accountTools.getAccountInfo({ username: testUsername });
      
      // Assert
      expect(result).toBeDefined();
      expect(result.isError).toBeUndefined(); // Should not be an error response
      
      // Parse the response content
      const content = result.content[0];
      expect(content.type).toBe('text');
      expect(content.mimeType).toBe('application/json');
      
      const accountData = JSON.parse(content.text);
      expect(accountData.name).toBe(testUsername);
      expect(accountData.id).toBeDefined();
      expect(accountData.balance).toBeDefined();
      expect(accountData.hbd_balance).toBeDefined();
      expect(accountData.created).toBeDefined();
    });
    
    it('should return error for non-existent account', async () => {
      // Arrange
      const nonExistentUsername = 'this-user-does-not-exist-on-hive-blockchain-123456789';
      
      // Act
      const result = await accountTools.getAccountInfo({ username: nonExistentUsername });
      
      // Assert
      expect(result).toBeDefined();
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error: Account');
      expect(result.content[0].text).toContain('not found');
    });
  });
  
  maybeDescribe('getAccountHistory', () => {
    it('should fetch account history with default limit', async () => {
      // Arrange
      const testUsername = getTestUsername();
      
      // Act
      const result = await accountTools.getAccountHistory({ 
        username: testUsername, 
        limit: 5,
        operation_filter: undefined
      });
      
      // Assert
      expect(result).toBeDefined();
      expect(result.isError).toBeUndefined();
      
      const content = result.content[0];
      expect(content.type).toBe('text');
      expect(content.mimeType).toBe('application/json');
      
      const historyData = JSON.parse(content.text);
      expect(historyData.account).toBe(testUsername);
      expect(historyData.operations).toBeDefined();
      expect(Array.isArray(historyData.operations)).toBe(true);
      
      // We requested 5 operations but might get fewer if account is new
      expect(historyData.operations_count).toBeLessThanOrEqual(5);
      
      if (historyData.operations.length > 0) {
        const firstOp = historyData.operations[0];
        expect(firstOp.index).toBeDefined();
        expect(firstOp.type).toBeDefined();
        expect(firstOp.timestamp).toBeDefined();
        expect(firstOp.transaction_id).toBeDefined();
        expect(firstOp.details).toBeDefined();
      }
    });
    
    it('should filter operations by type if filter is provided', async () => {
      // Arrange
      const testUsername = getTestUsername();
      const filterTypes = ['transfer']; // Only show transfer operations
      
      // Act
      const result = await accountTools.getAccountHistory({ 
        username: testUsername, 
        limit: 10,
        operation_filter: filterTypes
      });
      
      // Assert
      expect(result).toBeDefined();
      expect(result.isError).toBeUndefined();
      
      const historyData = JSON.parse(result.content[0].text);
      
      // If there are operations, they should all be transfers
      if (historyData.operations.length > 0) {
        historyData.operations.forEach((op) => {
          expect(op.type).toBe('transfer');
        });
      }
    });
  });
  
  maybeDescribe('getVestingDelegations', () => {
    it('should fetch vesting delegations if they exist', async () => {
      // Arrange
      const testUsername = getTestUsername();
      
      // Act
      const result = await accountTools.getVestingDelegations({ 
        username: testUsername, 
        limit: 5, 
        from: undefined
      });
      
      // Assert
      expect(result).toBeDefined();
      expect(result.isError).toBeUndefined();
      
      const content = result.content[0];
      expect(content.type).toBe('text');
      expect(content.mimeType).toBe('application/json');
      
      const delegationsData = JSON.parse(content.text);
      expect(delegationsData.account).toBe(testUsername);
      expect(delegationsData.delegations).toBeDefined();
      expect(Array.isArray(delegationsData.delegations)).toBe(true);
      
      // We can't assert the number of delegations since the account might not have any
      // But if there are any, they should have the correct structure
      if (delegationsData.delegations.length > 0) {
        const firstDelegation = delegationsData.delegations[0];
        expect(firstDelegation.delegator).toBe(testUsername);
        expect(firstDelegation.delegatee).toBeDefined();
        expect(firstDelegation.vesting_shares).toBeDefined();
        expect(firstDelegation.min_delegation_time).toBeDefined();
      }
    });
    
    it('should return empty delegations array for account with no delegations', async () => {
      // Arrange - using a test account that likely has no delegations
      const newAccountUsername = 'test-account-no-delegations';
      
      // Act
      const result = await accountTools.getVestingDelegations({ 
        username: newAccountUsername, 
        limit: 10, 
        from: undefined
      });
      
      // Assert - Either success with empty array or account not found
      if (!result.isError) {
        const delegationsData = JSON.parse(result.content[0].text);
        expect(delegationsData.delegations).toEqual([]);
        expect(delegationsData.delegations_count).toBe(0);
      } else {
        // If account doesn't exist, that's also an acceptable outcome
        expect(result.content[0].text).toContain('Error');
      }
    });
  });
});
