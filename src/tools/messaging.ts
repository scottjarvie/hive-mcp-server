// Messaging tools implementation
import { Memo, PrivateKey } from '@hiveio/dhive';
import client from '../config/client';
import config from '../config';
import { Response } from '../utils/response';
import { handleError } from '../utils/error';
import { successJson, errorResponse } from '../utils/response';
import logger from '../utils/logger';

// Helper function to get a public memo key for a Hive account
async function getMemoPublicKey(username: string): Promise<string> {
  try {
    const accounts = await client.database.getAccounts([username]);
    if (accounts.length === 0) {
      throw new Error(`User ${username} not found`);
    }
    return accounts[0].memo_key;
  } catch (error) {
    throw new Error(`Error fetching memo key for ${username}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Encrypt a message
export async function encryptMessage(
  params: { 
    message: string;
    recipient: string;
  }
): Promise<Response> {
  try {
    // Get credentials from environment variables
    const senderPrivateKey = config.hive.memoKey;

    if (!senderPrivateKey) {
      return errorResponse('Error: HIVE_MEMO_KEY environment variable is not set. Encryption requires your private memo key.');
    }

    // Get recipient's public memo key
    const recipientPublicKey = await getMemoPublicKey(params.recipient);
    
    // Encrypt message
    const encryptedMessage = Memo.encode(
      PrivateKey.fromString(senderPrivateKey),
      recipientPublicKey,
      params.message
    );
    
    return successJson({
      success: true,
      recipient: params.recipient,
      encrypted_message: encryptedMessage,
      note: "This encrypted message can only be decrypted by the recipient using their private memo key."
    });
  } catch (error) {
    return errorResponse(handleError(error, 'encrypt_message'));
  }
}

// Decrypt a message
export async function decryptMessage(
  params: { 
    encrypted_message: string;
    sender: string;
  }
): Promise<Response> {
  try {
    // Get credentials from environment variables
    const recipientPrivateKey = config.hive.memoKey;

    if (!recipientPrivateKey) {
      return errorResponse('Error: HIVE_MEMO_KEY environment variable is not set. Decryption requires your private memo key.');
    }

    // Get sender's public memo key
    const senderPublicKey = await getMemoPublicKey(params.sender);
    
    try {
      // Attempt to decrypt message
      const decryptedMessage = Memo.decode(
        PrivateKey.fromString(recipientPrivateKey),
        params.encrypted_message
      );
      
      return successJson({
        success: true,
        sender: params.sender,
        decrypted_message: decryptedMessage
      });
    } catch (decryptError) {
      return errorResponse(`Failed to decrypt message: ${decryptError instanceof Error ? decryptError.message : String(decryptError)}. This could be because the message was not encrypted for you, or the sender information is incorrect.`);
    }
  } catch (error) {
    return errorResponse(handleError(error, 'decrypt_message'));
  }
}

// Send an encrypted message (combines encryption with token sending)
export async function sendEncryptedMessage(
  params: { 
    message: string;
    recipient: string;
    amount: number;
  }
): Promise<Response> {
  try {
    // Get credentials from environment variables
    const username = config.hive.username;
    const activeKey = config.hive.activeKey;
    const memoKey = config.hive.memoKey;

    if (!username || !activeKey) {
      return errorResponse('Error: HIVE_USERNAME or HIVE_ACTIVE_KEY environment variables are not set. Sending requires an active key.');
    }

    if (!memoKey) {
      return errorResponse('Error: HIVE_MEMO_KEY environment variable is not set. Encryption requires your private memo key.');
    }

    // Get recipient's public memo key
    const recipientPublicKey = await getMemoPublicKey(params.recipient);
    
    // Encrypt message
    const encryptedMessage = Memo.encode(
      PrivateKey.fromString(memoKey),
      recipientPublicKey,
      params.message
    );
    
    // Format the amount with 3 decimal places and append HIVE
    const formattedAmount = `${params.amount.toFixed(3)} HIVE`;

    // Create the transfer operation
    const transfer = {
      from: username,
      to: params.recipient,
      amount: formattedAmount,
      memo: encryptedMessage,
    };

    // Broadcast the transfer using active key
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
      to: params.recipient,
      amount: formattedAmount,
      encrypted_message: encryptedMessage,
    });
  } catch (error) {
    return errorResponse(handleError(error, 'send_encrypted_message'));
  }
}

// Get encrypted messages from account history
export async function getEncryptedMessages(
  params: { 
    username: string;
    limit: number;
    decrypt: boolean;
  }
): Promise<Response> {
  try {
    // The getAccountHistory method needs a starting point (from) parameter
    // We'll use -1 to get the most recent transactions
    const from = -1;
    
    // Get account history
    const history = await client.database.getAccountHistory(
      params.username,
      from,
      params.limit * 3 // Request more than needed to filter for encrypted messages
    );

    if (!history || !Array.isArray(history)) {
      return successJson({
        account: params.username,
        messages_count: 0,
        messages: [],
      });
    }

    // Filter for transfer operations with encrypted memos
    let encryptedMessages = history
      .filter(([_index, operation]) => {
        // Only include transfer operations
        if (operation.op[0] !== 'transfer') return false;
        
        const opData = operation.op[1];
        // Check if memo starts with '#' (encrypted memos start with '#')
        return opData.memo && opData.memo.startsWith('#');
      })
      .map(([index, operation]) => {
        const { timestamp, trx_id } = operation;
        const opData = operation.op[1];
        
        // Determine if this is an incoming or outgoing message
        const direction = opData.to === params.username ? 'received' : 'sent';
        const otherParty = direction === 'received' ? opData.from : opData.to;
        
        return {
          index,
          transaction_id: trx_id,
          timestamp,
          direction,
          counterparty: otherParty,
          amount: opData.amount,
          encrypted_message: opData.memo,
          decrypted_message: null as string | null, // Will be populated later if decryption is requested
        };
      })
      .slice(0, params.limit); // Limit to requested number of messages

    // Decrypt messages if requested
    if (params.decrypt && config.hive.memoKey) {
      const memoPrivateKey = PrivateKey.fromString(config.hive.memoKey);
      
      for (let i = 0; i < encryptedMessages.length; i++) {
        const message = encryptedMessages[i];
        try {
          // Decrypt the message using our private memo key
          // The memo format already contains the necessary information about the sender/recipient
          message.decrypted_message = Memo.decode(
            memoPrivateKey,
            message.encrypted_message
          );
        } catch (decryptError) {
          logger.warn(`Failed to decrypt message ${i}: ${decryptError instanceof Error ? decryptError.message : String(decryptError)}`);
          message.decrypted_message = "[Decryption failed]";
        }
      }
    }

    return successJson({
      account: params.username,
      messages_count: encryptedMessages.length,
      messages: encryptedMessages,
      note: params.decrypt ? 
        "Messages were decrypted using your private memo key" : 
        "Set 'decrypt' parameter to true to attempt decryption of messages"
    });
  } catch (error) {
    return errorResponse(handleError(error, 'get_encrypted_messages'));
  }
}
