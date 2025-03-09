// Blockchain-related tools implementation
import client from '../config/client';
import { Response } from '../utils/response';
import { handleError } from '../utils/error';
import { successJson, errorResponse } from '../utils/response';

// Get blockchain properties and statistics
export async function getChainProperties(
  // Using an empty object for the params since the tool doesn't need any inputs
  _params: Record<string, never>
): Promise<Response> {
  try {
    // Fetch global properties
    const dynamicProps = await client.database.getDynamicGlobalProperties();
    const chainProps = await client.database.getChainProperties();
    const currentMedianHistoryPrice = await client.database.getCurrentMedianHistoryPrice();
    
    // Format the response
    const response = {
      dynamic_properties: dynamicProps,
      chain_properties: chainProps,
      current_median_history_price: {
        base: currentMedianHistoryPrice.base,
        quote: currentMedianHistoryPrice.quote,
      },
      timestamp: new Date().toISOString(),
    };
    
    return successJson(response);
  } catch (error) {
    return errorResponse(handleError(error, 'get_chain_properties'));
  }
}
