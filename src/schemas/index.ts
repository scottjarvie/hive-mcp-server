// Export all schemas in the format needed by the McpServer.tool() method
import { z } from 'zod';

// Import all the schema objects
import * as accountSchemas from './account';
import * as contentSchemas from './content';
import * as transactionSchemas from './transaction';
import * as cryptoSchemas from './crypto';
import * as blockchainSchemas from './blockchain';
import * as messagingSchemas from './messaging';
export * from './common';

// Helper function to extract the shape from a ZodObject
function getZodShape<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema._def.shape();
}

// Messaging schemas
export const encryptMessageSchema = getZodShape(messagingSchemas.encryptMessageSchema);
export const decryptMessageSchema = getZodShape(messagingSchemas.decryptMessageSchema);
export const sendEncryptedMessageSchema = getZodShape(messagingSchemas.sendEncryptedMessageSchema);
export const getEncryptedMessagesSchema = getZodShape(messagingSchemas.getEncryptedMessagesSchema);

// Account schemas
export const getAccountInfoSchema = getZodShape(accountSchemas.getAccountInfoSchema);
export const getAccountHistorySchema = getZodShape(accountSchemas.getAccountHistorySchema);
export const getVestingDelegationsSchema = getZodShape(accountSchemas.getVestingDelegationsSchema);

// Content schemas
export const getPostContentSchema = getZodShape(contentSchemas.getPostContentSchema);
export const getPostsByTagSchema = getZodShape(contentSchemas.getPostsByTagSchema);
export const getPostsByUserSchema = getZodShape(contentSchemas.getPostsByUserSchema);
export const createPostSchema = getZodShape(contentSchemas.createPostSchema);
export const createCommentSchema = getZodShape(contentSchemas.createCommentSchema);

// Transaction schemas
export const voteOnPostSchema = getZodShape(transactionSchemas.voteOnPostSchema);
export const sendTokenSchema = getZodShape(transactionSchemas.sendTokenSchema);

// Crypto schemas
export const signMessageSchema = getZodShape(cryptoSchemas.signMessageSchema);
export const verifySignatureSchema = getZodShape(cryptoSchemas.verifySignatureSchema);

// Blockchain schemas
export const getChainPropertiesSchema = getZodShape(blockchainSchemas.getChainPropertiesSchema);
