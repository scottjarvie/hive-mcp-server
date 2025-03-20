// src/tools/prompts.ts
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol';

// Handler for the create-post prompt
export async function createPostPrompt(
  params: { title: string; content: string; tags?: string }, 
  _extra: RequestHandlerExtra
) {
  const title = params.title || "[Title]";
  const content = params.content || "[Content]";
  const tags = params.tags || "hive,blog";
  
  return {
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Please create a new post on the Hive blockchain with the following details:
Title: ${title}
Content: ${content}
Tags: ${tags}

When done, please provide a link to the published post.`
        }
      }
    ]
  };
}

// Handler for the analyze-account prompt
export async function analyzeAccountPrompt(
  params: { username?: string },
  _extra: RequestHandlerExtra
) {
  const username = params.username || "[username]";
  
  return {
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Please analyze the Hive account @${username}. Include the following information:
- Account age
- Posting frequency
- Number of followers and following
- Common topics/tags
- Reputation score
- Recent activity`
        }
      }
    ]
  };
}
