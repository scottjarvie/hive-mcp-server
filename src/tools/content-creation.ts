// Content creation tools implementation
import { PrivateKey } from '@hiveio/dhive';
import client from '../config/client';
import config from '../config';
import { Response } from '../utils/response';
import { handleError } from '../utils/error';
import { successJson, errorResponse } from '../utils/response';

// Create a new blog post
export async function createPost(
  params: {
    title: string;
    body: string;
    tags: string[];
    beneficiaries?: { account: string; weight: number }[] | null;
    permalink?: string;
    max_accepted_payout?: string;
    percent_hbd?: number;
    allow_votes: boolean;
    allow_curation_rewards: boolean;
  }
): Promise<Response> {
  try {
    // Get credentials from environment variables
    const username = config.hive.username;
    const postingKey = config.hive.postingKey;

    if (!username || !postingKey) {
      return errorResponse('Error: HIVE_USERNAME or HIVE_POSTING_KEY environment variables are not set.');
    }

    // Generate permalink if not provided
    const finalPermalink =
      params.permalink ||
      params.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .slice(0, 255); // Restrict to 255 chars

    // Ensure first tag is used as the main category
    const finalTags = [...new Set(params.tags)]; // Remove duplicates

    // Prepare the post operation
    const postOperation = {
      parent_author: '', // Empty for main posts (non-comments)
      parent_permlink: finalTags[0], // First tag is the main category
      author: username,
      permlink: finalPermalink,
      title: params.title,
      body: params.body,
      json_metadata: JSON.stringify({
        tags: finalTags,
        app: 'hive-mcp-server/1.0',
      }),
    };

    // Prepare post options if needed
    let hasOptions = false;
    const options: {
      author: string;
      permlink: string;
      max_accepted_payout: string;
      percent_hbd: number;
      allow_votes: boolean;
      allow_curation_rewards: boolean;
      extensions: [0, { beneficiaries: { account: string; weight: number }[] }][];
    } = {
      author: username,
      permlink: finalPermalink,
      max_accepted_payout: params.max_accepted_payout || '1000000.000 HBD',
      percent_hbd: params.percent_hbd ?? 10000,
      allow_votes: params.allow_votes,
      allow_curation_rewards: params.allow_curation_rewards,
      extensions: params.beneficiaries?.length
        ? [
            [
              0,
              {
                beneficiaries: params.beneficiaries.map((b) => ({
                  account: b.account,
                  weight: b.weight,
                })),
              },
            ],
          ]
        : [],
    };

    // Add optional parameters if provided
    if (params.max_accepted_payout) {
      options.max_accepted_payout = params.max_accepted_payout;
      hasOptions = true;
    }

    if (params.percent_hbd !== undefined) {
      options.percent_hbd = params.percent_hbd;
      hasOptions = true;
    }

    // Add beneficiaries if provided
    if (params.beneficiaries && params.beneficiaries.length > 0) {
      options.extensions = [
        [
          0,
          {
            beneficiaries: params.beneficiaries.map((b) => ({
              account: b.account,
              weight: b.weight,
            })),
          },
        ],
      ];
      hasOptions = true;
    }

    let result;
    if (hasOptions) {
      // Use commentWithOptions when we have options
      result = await client.broadcast.commentWithOptions(
        postOperation,
        options,
        PrivateKey.fromString(postingKey)
      );
    } else {
      // Use standard comment for basic posts
      result = await client.broadcast.comment(
        postOperation,
        PrivateKey.fromString(postingKey)
      );
    }

    return successJson({
      success: true,
      transaction_id: result.id,
      transaction_url: `https://www.hiveblockexplorer.com/tx/${result.id}`,
      block_num: result.block_num,
      author: username,
      permlink: finalPermalink,
      title: params.title,
      tags: finalTags,
      url: `https://hive.blog/@${username}/${finalPermalink}`,
    });
  } catch (error) {
    return errorResponse(handleError(error, 'create_post'));
  }
}

// Create a comment on an existing post or reply to a comment
export async function createComment(
  params: {
    parent_author: string;
    parent_permlink: string;
    body: string;
    permalink?: string;
    beneficiaries?: { account: string; weight: number }[] | null;
    max_accepted_payout?: string;
    percent_hbd?: number;
    allow_votes: boolean;
    allow_curation_rewards: boolean;
  }
): Promise<Response> {
  try {
    // Get credentials from environment variables
    const username = config.hive.username;
    const postingKey = config.hive.postingKey;

    if (!username || !postingKey) {
      return errorResponse('Error: HIVE_USERNAME or HIVE_POSTING_KEY environment variables are not set.');
    }

    // Generate a random permalink if not provided
    const finalPermalink =
      params.permalink ||
      `re-${params.parent_permlink.slice(0, 20)}-${Date.now().toString(36)}`;

    // Prepare the comment operation
    const commentOperation = {
      parent_author: params.parent_author,
      parent_permlink: params.parent_permlink,
      author: username,
      permlink: finalPermalink,
      title: '', // Comments don't have titles
      body: params.body,
      json_metadata: JSON.stringify({
        app: 'hive-mcp-server/1.0',
      }),
    };

    // Prepare comment options if needed
    let hasOptions = false;
    const options: {
      author: string;
      permlink: string;
      max_accepted_payout: string;
      percent_hbd: number;
      allow_votes: boolean;
      allow_curation_rewards: boolean;
      extensions: [0, { beneficiaries: { account: string; weight: number }[] }][];
    } = {
      author: username,
      permlink: finalPermalink,
      max_accepted_payout: params.max_accepted_payout || '1000000.000 HBD',
      percent_hbd: params.percent_hbd ?? 10000,
      allow_votes: params.allow_votes,
      allow_curation_rewards: params.allow_curation_rewards,
      extensions: params.beneficiaries?.length
        ? [
            [
              0,
              {
                beneficiaries: params.beneficiaries.map((b) => ({
                  account: b.account,
                  weight: b.weight,
                })),
              },
            ],
          ]
        : [],
    };

    // Add optional parameters if provided
    if (params.max_accepted_payout) {
      options.max_accepted_payout = params.max_accepted_payout;
      hasOptions = true;
    }

    if (params.percent_hbd !== undefined) {
      options.percent_hbd = params.percent_hbd;
      hasOptions = true;
    }

    // Add beneficiaries if provided
    if (params.beneficiaries && params.beneficiaries.length > 0) {
      options.extensions = [
        [
          0,
          {
            beneficiaries: params.beneficiaries.map((b) => ({
              account: b.account,
              weight: b.weight,
            })),
          },
        ],
      ];
      hasOptions = true;
    }

    let result;
    if (hasOptions) {
      // Use commentWithOptions when we have options
      result = await client.broadcast.commentWithOptions(
        commentOperation,
        options,
        PrivateKey.fromString(postingKey)
      );
    } else {
      // Use standard comment for basic comments
      result = await client.broadcast.comment(
        commentOperation,
        PrivateKey.fromString(postingKey)
      );
    }

    return successJson({
      success: true,
      transaction_id: result.id,
      transaction_url: `https://www.hiveblockexplorer.com/tx/${result.id}`,
      block_num: result.block_num,
      parent_author: params.parent_author,
      parent_permlink: params.parent_permlink,
      author: username,
      permlink: finalPermalink,
      url: `https://hive.blog/@${params.parent_author}/${params.parent_permlink}#@${username}/${finalPermalink}`,
    });
  } catch (error) {
    return errorResponse(handleError(error, 'create_comment'));
  }
}
