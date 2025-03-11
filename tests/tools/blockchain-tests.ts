/**
 * Tests for blockchain-related tools
 * 
 * These tests validate the functionality of the blockchain-related tools:
 * - getChainProperties
 */

// const blockchainTools = require('../../src/tools/blockchain');

describe('Blockchain Tools', () => {
  describe('getChainProperties', () => {
    it('should fetch blockchain properties successfully', async () => {
      // Act
      const result = await blockchainTools.getChainProperties({});
      
      // Assert
      expect(result).toBeDefined();
      expect(result.isError).toBeUndefined(); // Should not be an error response
      
      // Parse the response content
      const content = result.content[0];
      expect(content.type).toBe('text');
      expect(content.mimeType).toBe('application/json');
      
      const chainData = JSON.parse(content.text);
      
      // Verify structure of response
      expect(chainData.dynamic_properties).toBeDefined();
      expect(chainData.chain_properties).toBeDefined();
      expect(chainData.current_median_history_price).toBeDefined();
      expect(chainData.timestamp).toBeDefined();
      
      // Verify specific properties
      const dynamicProps = chainData.dynamic_properties;
      expect(dynamicProps.head_block_number).toBeDefined();
      expect(Number(dynamicProps.head_block_number)).toBeGreaterThan(0);
      expect(dynamicProps.time).toBeDefined();
      expect(dynamicProps.current_supply).toBeDefined();
      expect(dynamicProps.current_hbd_supply).toBeDefined();
      
      // Verify chain properties
      const chainProps = chainData.chain_properties;
      expect(chainProps.account_creation_fee).toBeDefined();
      expect(chainProps.maximum_block_size).toBeDefined();
      expect(chainProps.hbd_interest_rate).toBeDefined();
      
      // Verify price feed
      const priceFeed = chainData.current_median_history_price;
      expect(priceFeed.base).toBeDefined();
      expect(priceFeed.quote).toBeDefined();
    });
    
    it('should include timestamp in response', async () => {
      // Act
      const result = await blockchainTools.getChainProperties({});
      
      // Assert
      const chainData = JSON.parse(result.content[0].text);
      
      // Verify timestamp format and validity
      const timestamp = chainData.timestamp;
      expect(timestamp).toBeDefined();
      
      // Verify timestamp is a valid ISO date
      const timestampDate = new Date(timestamp);
      expect(timestampDate.getTime()).not.toBeNaN(); // Should be a valid date
      
      // Verify timestamp is recent (within the last hour)
      const now = new Date();
      const timeDifferenceMs = now.getTime() - timestampDate.getTime();
      expect(timeDifferenceMs).toBeLessThan(60 * 60 * 1000); // Less than 1 hour
    });
  });
});
