// Transaction-related tools implementation
import { PrivateKey } from '@hiveio/dhive';
import client from '../config/client';
import config from '../config';
import { Response } from '../utils/response';
import { handleError } from '../utils/error';
import { successJson, errorResponse } from '../utils/response';

// Vote on a post
export async function voteOnPost(
  params: { 
    author: string; 
    permlink: string;
    weight: number;
  }
): Promise<Response> {
  try {
    // Get credentials from environment variables
    const username = config.hive.username;
    const privateKey = config.hive.postingKey;

    if (!username || !privateKey) {
      return errorResponse('Error: HIVE_USERNAME or HIVE_POSTING_KEY environment variables are not set');
    }

    // Create the vote operation
    const vote = {
      voter: username,
      author: params.author,
      permlink: params.permlink,
      weight: params.weight,
    };

    // Create the broadcast instance and broadcast the vote
    const result = await client.broadcast.vote(
      vote,
      PrivateKey.fromString(privateKey)
    );

    return successJson({
      success: true,
      transaction_id: result.id,
      transaction_url: `https://www.hiveblockexplorer.com/tx/${result.id}`,
      block_num: result.block_num,
      voter: username,
      author: params.author,
      permlink: params.permlink,
      weight: params.weight,
    });
  } catch (error) {
    return errorResponse(handleError(error, 'vote_on_post'));
  }
}

// Send HIVE or HBD to another account
export async function sendToken(
  params: { 
    to: string; 
    amount: number;
    currency: string;
    memo?: string;
  }
): Promise<Response> {
  try {
    // Get credentials from environment variables
    const username = config.hive.username;
    const activeKey = config.hive.activeKey;

    if (!username || !activeKey) {
      return errorResponse('Error: HIVE_USERNAME or HIVE_ACTIVE_KEY environment variables are not set. Note that transfers require an active key, not a posting key.');
    }

    // Format the amount with 3 decimal places and append the currency
    const formattedAmount = `${params.amount.toFixed(3)} ${params.currency}`;

    // Create the transfer operation
    const transfer = {
      from: username,
      to: params.to,
      amount: formattedAmount,
      memo: params.memo || '',
    };

    // Broadcast the transfer using active key (required for transfers)
    const result = await client.broadcast.transfer(
      transfer,
      PrivateKey.fromString(activeKey)
    );

    return successJson({
      success: true,
      transaction_id: result.id,
      transaction_url: `https://www.hiveblockexplorer.com/tx/${result.id}`,
      block_num: result.block_num,
      from: username,
      to: params.to,
      amount: formattedAmount,
      memo: params.memo || '(no memo)',
    });
  } catch (error) {
    return errorResponse(handleError(error, 'send_token'));
  }
}
