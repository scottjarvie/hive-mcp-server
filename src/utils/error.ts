// Error handling utilities

// Handle errors consistently
export function handleError(error: unknown, context: string): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return `Error in ${context}: ${errorMessage}`;
}

export default {
  handleError,
};
