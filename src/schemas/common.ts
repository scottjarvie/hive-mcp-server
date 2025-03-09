// Common schema components that can be reused across multiple tools
import { z } from 'zod';

// Schema for parsing tags from either array or comma-separated string
export const tagsSchema = z
  .union([
    z.array(z.string()),
    z.string().transform((val, ctx) => {
      // Handle empty string
      if (!val.trim()) return ['blog'];

      try {
        // Try to parse it as JSON first in case it's a properly formatted JSON array
        if (val.startsWith('[') && val.endsWith(']')) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              return parsed;
            }
          } catch (e) {
            // Failed to parse as JSON, continue to other methods
          }
        }

        // Handle comma-separated list (possibly with quotes)
        return val
          .replace(/^\[|\]$/g, '') // Remove outer brackets if present
          .split(',')
          .map(
            (item) =>
              item
                .trim()
                .replace(/^['"]|['"]$/g, '') // Remove surrounding quotes
                .toLowerCase() // Hive tags are lowercase
          )
          .filter(Boolean); // Remove empty entries
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Could not parse tags: ${val}. Please provide a comma-separated list or array of tags.`,
        });
        return z.NEVER;
      }
    }),
  ])
  .default(['blog']);

// Schema for operation filter parameter
export const operationFilterSchema = z
  .union([
    z.array(z.string()),
    z.string().transform((val, ctx) => {
      // Handle empty string
      if (!val.trim()) return [];

      try {
        // Try to parse it as JSON first in case it's a properly formatted JSON array
        if (val.startsWith('[') && val.endsWith(']')) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              return parsed;
            }
          } catch (e) {
            // Failed to parse as JSON, continue to other methods
          }
        }

        // Handle comma-separated list (possibly with quotes)
        return val
          .replace(/^\[|\]$/g, '') // Remove outer brackets if present
          .split(',')
          .map(
            (item) => item.trim().replace(/^['"]|['"]$/g, '') // Remove surrounding quotes
          )
          .filter(Boolean); // Remove empty entries
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Could not parse operation_filter: ${val}. Please provide a comma-separated list or array of operation types.`,
        });
        return z.NEVER;
      }
    }),
  ])
  .optional();

// Schema for beneficiaries
export const beneficiariesSchema = z
  .union([
    z.array(
      z.object({
        account: z.string(),
        weight: z.number().min(1).max(10000),
      })
    ),
    z.null(),
  ])
  .optional()
  .nullable();

// Export valid discussion query categories
export const tagQueryCategories = z.enum([
  'active',
  'cashout',
  'children',
  'comments',
  'created',
  'hot',
  'promoted',
  'trending',
  'votes',
]);

// Export valid user-based query categories
export const userQueryCategories = z.enum(['blog', 'feed']);
