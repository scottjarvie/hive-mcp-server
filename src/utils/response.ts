// Utilities for formatting consistent responses
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol';

// Update the Response interface to include index signature
export interface SuccessResponse {
  [key: string]: unknown;
  content: {
    type: 'text';
    text: string;
    mimeType?: string;
  }[];
  isError?: false;
}

export interface ErrorResponse {
  [key: string]: unknown;
  content: {
    type: 'text';
    text: string;
    mimeType?: string;
  }[];
  isError: true;
}

export type Response = SuccessResponse | ErrorResponse;

// Create a successful JSON response
export function successJson(data: unknown): Response {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
        mimeType: 'application/json',
      },
    ],
  };
}

// Create a successful text response
export function successText(text: string): Response {
  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}

// Create an error response
export function errorResponse(message: string): Response {
  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    isError: true,
  };
}

// Wrapper to adapt tool handlers to MCP SDK format
export function adaptHandler<T>(
  handler: (params: T) => Promise<Response>
): (params: T, extra: RequestHandlerExtra) => Promise<Response> {
  return async (params: T, extra: RequestHandlerExtra): Promise<Response> => {
    return await handler(params);
  };
}

export default {
  successJson,
  successText,
  errorResponse,
  adaptHandler,
};
