// Global setup for Jest tests
require('dotenv').config();

// Check if required environment variables are set
const requiredEnvVars = [
  'HIVE_USERNAME'
];

const recommendedEnvVars = [
  'HIVE_POSTING_KEY',
  'HIVE_ACTIVE_KEY',
  'HIVE_MEMO_KEY'
];

// Validate required environment variables
const missingRequiredVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingRequiredVars.length > 0) {
  console.warn(`Warning: Required environment variables are missing: ${missingRequiredVars.join(', ')}`);
  console.warn('Some tests that require these variables will be skipped.');
}

// Check recommended environment variables
const missingRecommendedVars = recommendedEnvVars.filter(varName => !process.env[varName]);
if (missingRecommendedVars.length > 0) {
  console.warn(`Warning: Recommended environment variables are missing: ${missingRecommendedVars.join(', ')}`);
  console.warn('Some authenticated tests may be skipped.');
}

// Increase timeout for Jest tests that interact with Hive blockchain
jest.setTimeout(15000);
