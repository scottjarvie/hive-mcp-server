// Content and posting schemas
import { z } from 'zod';
import { tagsSchema, tagQueryCategories, userQueryCategories, beneficiariesSchema } from './common';

// Schema for get_post_content tool
export const getPostContentSchema = z.object({
  author: z.string().describe('Author of the post'),
  permlink: z.string().describe('Permlink of the post'),
});

// Schema for get_posts_by_tag tool
export const getPostsByTagSchema = z.object({
  category: tagQueryCategories.describe(
    'Sorting category for posts (e.g. trending, hot, created)'
  ),
  tag: z.string().describe('The tag to filter posts by'),
  limit: z
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe('Number of posts to return (1-20)'),
});

// Schema for get_posts_by_user tool
export const getPostsByUserSchema = z.object({
  category: userQueryCategories.describe(
    'Type of user posts to fetch (blog = posts by user, feed = posts from users they follow)'
  ),
  username: z.string().describe('Hive username to fetch posts for'),
  limit: z
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe('Number of posts to return (1-20)'),
});

// Schema for create_post tool
export const createPostSchema = z.object({
  title: z.string().min(1).max(256).describe('Title of the blog post'),
  body: z
    .string()
    .min(1)
    .describe('Content of the blog post, can include Markdown formatting'),
  tags: tagsSchema.describe(
    'Tags for the post. Can be provided as comma-separated string \'blog,life,writing\' or array'
  ),
  beneficiaries: beneficiariesSchema.describe(
    'Optional list of beneficiaries to receive a portion of the rewards'
  ),
  permalink: z
    .string()
    .optional()
    .describe(
      'Optional custom permalink. If not provided, one will be generated from the title'
    ),
  max_accepted_payout: z
    .string()
    .optional()
    .describe('Optional maximum accepted payout (e.g. \'1000.000 HBD\')'),
  percent_hbd: z
    .number()
    .min(0)
    .max(10000)
    .optional()
    .describe(
      'Optional percent of HBD in rewards (0-10000, where 10000 = 100%)'
    ),
  allow_votes: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to allow votes on the post'),
  allow_curation_rewards: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to allow curation rewards'),
});

// Schema for create_comment tool
export const createCommentSchema = z.object({
  parent_author: z
    .string()
    .describe('Username of the post author or comment you\'re replying to'),
  parent_permlink: z
    .string()
    .describe('Permlink of the post or comment you\'re replying to'),
  body: z
    .string()
    .min(1)
    .describe('Content of the comment, can include Markdown formatting'),
  permalink: z
    .string()
    .optional()
    .describe(
      'Optional custom permalink for your comment. If not provided, one will be generated'
    ),
  beneficiaries: beneficiariesSchema.describe(
    'Optional list of beneficiaries to receive a portion of the rewards'
  ),
  max_accepted_payout: z
    .string()
    .optional()
    .describe('Optional maximum accepted payout (e.g. \'1000.000 HBD\')'),
  percent_hbd: z
    .number()
    .min(0)
    .max(10000)
    .optional()
    .describe(
      'Optional percent of HBD in rewards (0-10000, where 10000 = 100%)'
    ),
  allow_votes: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to allow votes on the comment'),
  allow_curation_rewards: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to allow curation rewards'),
});
