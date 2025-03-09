// Transaction schemas
import { z } from 'zod';

// Schema for vote_on_post tool
export const voteOnPostSchema = z.object({
  author: z.string().describe('Author of the post to vote on'),
  permlink: z.string().describe('Permlink of the post to vote on'),
  weight: z
    .number()
    .min(-10000)
    .max(10000)
    .describe(
      'Vote weight from -10000 (100% downvote) to 10000 (100% upvote)'
    ),
});

// Schema for send_token tool
export const sendTokenSchema = z.object({
  to: z.string().describe('Recipient Hive username'),
  amount: z.number().positive().describe('Amount of tokens to send'),
  currency: z.enum(['HIVE', 'HBD']).describe('Currency to send: HIVE or HBD'),
  memo: z
    .string()
    .optional()
    .describe('Optional memo to include with the transaction'),
});
