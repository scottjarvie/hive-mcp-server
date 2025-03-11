// Messaging schemas
import { z } from 'zod';

// Schema for encrypt_message tool
export const encryptMessageSchema = z.object({
  message: z.string().min(1).describe('Message to encrypt'),
  recipient: z.string().describe('Hive username of the recipient'),
});

// Schema for decrypt_message tool
export const decryptMessageSchema = z.object({
  encrypted_message: z.string().startsWith('#').describe('Encrypted message (starts with #)'),
  sender: z.string().describe('Hive username of the sender'),
});

// Schema for send_encrypted_message tool
export const sendEncryptedMessageSchema = z.object({
  message: z.string().min(1).describe('Message to encrypt and send'),
  recipient: z.string().describe('Hive username of the recipient'),
  amount: z.number().min(0.001).default(0.001).describe('Amount of HIVE to send (minimum 0.001)'),
});

// Schema for get_encrypted_messages tool - updated with optional username
export const getEncryptedMessagesSchema = z.object({
  username: z.string().optional().describe('Hive username to fetch encrypted messages for (defaults to configured account if not specified)'),
  limit: z.number().min(1).max(100).default(20).describe('Maximum number of messages to retrieve'),
  decrypt: z.boolean().default(false).describe('Whether to attempt decryption of messages'),
});
