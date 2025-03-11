/**
 * Tests for response utilities
 * 
 * These tests validate the behavior of response formatting utilities
 */

// const responseUtils = require('../../src/utils/response');

describe('Response Utilities', () => {
  describe('successJson', () => {
    it('should format JSON responses correctly', () => {
      // Arrange
      const testData = { 
        success: true, 
        message: 'Operation successful',
        data: {
          id: 1,
          name: 'Test'
        }
      };
      
      // Act
      const response = responseUtils.successJson(testData);
      
      // Assert
      expect(response).toBeDefined();
      expect(response.isError).toBeUndefined(); // Not an error
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].mimeType).toBe('application/json');
      
      // Verify JSON content
      const parsedResponse = JSON.parse(response.content[0].text);
      expect(parsedResponse).toEqual(testData);
    });
    
    it('should handle nested objects and arrays', () => {
      // Arrange
      const complexData = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ],
        metadata: {
          count: 2,
          page: 1,
          nested: {
            deeply: {
              value: true
            }
          }
        }
      };
      
      // Act
      const response = responseUtils.successJson(complexData);
      
      // Assert
      const parsedResponse = JSON.parse(response.content[0].text);
      expect(parsedResponse).toEqual(complexData);
      expect(parsedResponse.items.length).toBe(2);
      expect(parsedResponse.metadata.nested.deeply.value).toBe(true);
    });
  });
  
  describe('successText', () => {
    it('should format text responses correctly', () => {
      // Arrange
      const testMessage = 'This is a test message';
      
      // Act
      const response = responseUtils.successText(testMessage);
      
      // Assert
      expect(response).toBeDefined();
      expect(response.isError).toBeUndefined(); // Not an error
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toBe(testMessage);
      expect(response.content[0].mimeType).toBeUndefined(); // No mime type for plain text
    });
  });
  
  describe('errorResponse', () => {
    it('should format error responses correctly', () => {
      // Arrange
      const errorMessage = 'An error occurred during the operation';
      
      // Act
      const response = responseUtils.errorResponse(errorMessage);
      
      // Assert
      expect(response).toBeDefined();
      expect(response.isError).toBe(true); // Marked as an error
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toBe(errorMessage);
    });
    
    it('should preserve error message structure', () => {
      // Arrange
      const detailedError = 'Error in account_info: Account not found (404)';
      
      // Act
      const response = responseUtils.errorResponse(detailedError);
      
      // Assert
      expect(response.content[0].text).toBe(detailedError);
    });
  });
});
