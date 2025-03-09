// Content retrieval tools implementation
import client from '../config/client';
import { Response } from '../utils/response';
import { handleError } from '../utils/error';
import { successJson, errorResponse } from '../utils/response';
import { DiscussionQueryCategory } from '@hiveio/dhive';

// Get a specific post by author and permlink
export async function getPostContent(
  params: { author: string; permlink: string }
): Promise<Response> {
  try {
    const content = await client.database.call('get_content', [
      params.author,
      params.permlink,
    ]);
    
    if (!content.author) {
      return errorResponse(`Error: Post not found: ${params.author}/${params.permlink}`);
    }
    
    return successJson({
      title: content.title,
      author: content.author,
      body: content.body,
      created: content.created,
      last_update: content.last_update,
      category: content.category,
      tags: content.json_metadata ? JSON.parse(content.json_metadata).tags || [] : [],
      url: `https://hive.blog/@${params.author}/${params.permlink}`,
    });
  } catch (error) {
    return errorResponse(handleError(error, 'get_post_content'));
  }
}

// Get posts by tag
export async function getPostsByTag(
  params: { 
    category: string; 
    tag: string; 
    limit: number;
  }
): Promise<Response> {
  try {
    const posts = await client.database.getDiscussions(
      params.category as DiscussionQueryCategory, 
      {
        tag: params.tag,
        limit: params.limit,
      }
    );

    const formattedPosts = posts.map((post) => ({
      title: post.title,
      author: post.author,
      permlink: post.permlink,
      created: post.created,
      votes: post.net_votes,
      payout: post.pending_payout_value,
      url: `https://hive.blog/@${post.author}/${post.permlink}`,
    }));

    return successJson(formattedPosts);
  } catch (error) {
    return errorResponse(handleError(error, 'get_posts_by_tag'));
  }
}

// Get posts by user
export async function getPostsByUser(
  params: { 
    category: string; 
    username: string; 
    limit: number;
  }
): Promise<Response> {
  try {
    // For blog and feed queries, the username is provided as the tag parameter
    const posts = await client.database.getDiscussions(
      params.category as DiscussionQueryCategory, 
      {
        tag: params.username,
        limit: params.limit,
      }
    );

    const formattedPosts = posts.map((post) => ({
      title: post.title,
      author: post.author,
      permlink: post.permlink,
      created: post.created,
      votes: post.net_votes,
      payout: post.pending_payout_value,
      url: `https://hive.blog/@${post.author}/${post.permlink}`,
    }));

    return successJson(formattedPosts);
  } catch (error) {
    return errorResponse(handleError(error, 'get_posts_by_user'));
  }
}
