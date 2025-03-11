// tests/utils/test-helpers.ts

/**
 * Helper functions for tests
 */

/**
 * Check if we can run authenticated tests
 * @returns boolean True if the environment variables needed for authenticated tests are set
 */
export function canRunAuthenticatedTests(): boolean {
  return Boolean(process.env.HIVE_USERNAME);
}

/**
 * Get a test username - either from env vars or a known account
 * @returns string A username to use for testing
 */
export function getTestUsername(): string {
  return process.env.HIVE_USERNAME || 'helo';
}
