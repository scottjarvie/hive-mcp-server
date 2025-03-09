// Account-related schemas
import { z } from 'zod';
import { operationFilterSchema } from './common';

// Schema for get_account_info tool
export const getAccountInfoSchema = z.object({
  username: z.string().describe('Hive username to fetch information for'),
});

// Schema for get_account_history tool
export const getAccountHistorySchema = z.object({
  username: z.string().describe('Hive username'),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .describe('Number of operations to return'),
  operation_filter: operationFilterSchema.describe(
    'Operation types to filter for. Can be provided as an array [\'transfer\', \'vote\'] or a comma-separated string \'transfer,vote\''
  ),
});

// Schema for get_vesting_delegations tool
export const getVestingDelegationsSchema = z.object({
  username: z.string().describe('Hive account to get delegations for'),
  limit: z.number().min(1).max(1000).default(100).describe('Maximum number of delegations to retrieve'),
  from: z.string().optional().describe('Optional starting account for pagination'),
});
