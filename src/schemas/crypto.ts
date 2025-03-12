// Cryptography tool schemas
import { z } from 'zod';

// Schema for sign_message tool
export const signMessageSchema = z.object({
  message: z.string().min(1).describe('Message to sign (must not be empty)'),
  key_type: z
    .enum(['posting', 'active', 'memo', 'owner'])
    .optional()
    .default('posting')
    .describe(
      'Type of key to use: \'posting\', \'active\', or \'memo\'. Defaults to \'posting\' if not specified.'
    ),
});

// Schema for verify_signature tool
export const verifySignatureSchema = z.object({
  message_hash: z
    .string()
    .describe(
      'The SHA-256 hash of the message in hex format (64 characters)'
    ),
  signature: z.string().describe('Signature string to verify'),
  public_key: z
    .string()
    .describe(
      'Public key to verify against (with or without the STM prefix)'
    ),
});
