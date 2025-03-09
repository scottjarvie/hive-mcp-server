// Account-related tools implementation
import client from '../config/client';
import { Response } from '../utils/response';
import { handleError } from '../utils/error';
import { successJson, errorResponse } from '../utils/response';

// Get account information
export async function getAccountInfo(
  params: { username: string }
): Promise<Response> {
  try {
    const accounts = await client.database.getAccounts([params.username]);
    if (accounts.length === 0) {
      return errorResponse(`Error: Account ${params.username} not found`);
    }
    
    const accountData = accounts[0];
    return successJson(accountData);
  } catch (error) {
    return errorResponse(handleError(error, 'get_account_info'));
  }
}

// Get account history
export async function getAccountHistory(
  params: { 
    username: string; 
    limit: number; 
    operation_filter?: string[] | undefined;
  }
): Promise<Response> {
  try {
    // The getAccountHistory method needs a starting point (from) parameter
    // We'll use -1 to get the most recent transactions
    const from = -1;

    // Convert string operation types to their numerical bitmask if provided
    let operation_bitmask = undefined;
    if (params.operation_filter && params.operation_filter.length > 0) {
      // For simplicity, we're skipping the bitmask transformation
    }

    const history = await client.database.getAccountHistory(
      params.username,
      from,
      params.limit,
      operation_bitmask
    );

    if (!history || !Array.isArray(history)) {
      return successJson({
        account: params.username,
        operations_count: 0,
        operations: [],
      });
    }

    // Format the history into a structured object
    const formattedHistory = history
      .map(([index, operation]) => {
        const { timestamp, op, trx_id } = operation;
        const opType = op[0];
        const opData = op[1];

        // Filter operations if needed
        if (
          params.operation_filter &&
          params.operation_filter.length > 0 &&
          !params.operation_filter.includes(opType)
        ) {
          return null;
        }

        return {
          index,
          type: opType,
          timestamp,
          transaction_id: trx_id,
          details: opData,
        };
      })
      .filter(Boolean); // Remove null entries (filtered out operations)

    return successJson({
      account: params.username,
      operations_count: formattedHistory.length,
      operations: formattedHistory,
    });
  } catch (error) {
    return errorResponse(handleError(error, 'get_account_history'));
  }
}

// Get vesting delegations
export async function getVestingDelegations(
  params: { 
    username: string; 
    limit: number; 
    from?: string;
  }
): Promise<Response> {
  try {
    const delegations = await client.database.getVestingDelegations(
      params.username,
      params.from || "",
      params.limit
    );
    
    // Format the data for better readability
    const formattedDelegations = delegations.map(delegation => ({
      delegator: delegation.delegator,
      delegatee: delegation.delegatee,
      vesting_shares: delegation.vesting_shares,
      min_delegation_time: delegation.min_delegation_time,
    }));
    
    return successJson({
      account: params.username,
      delegations_count: formattedDelegations.length,
      delegations: formattedDelegations
    });
  } catch (error) {
    return errorResponse(handleError(error, 'get_vesting_delegations'));
  }
}
