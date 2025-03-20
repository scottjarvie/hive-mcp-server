// src/schemas/prompts.ts
import { z } from 'zod';

// Schema for create-post prompt
export const createPostSchema = z.object({
  title: z.string().describe("Title of the post"),
  content: z.string().describe("Content of the post in markdown"),
  tags: z.string().optional().describe("Comma-separated list of tags")
});

// Schema for analyze-account prompt
export const analyzeAccountSchema = z.object({
  username: z.string().describe("Hive username to analyze")
});
