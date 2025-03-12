// Global setup for Jest tests
import 'dotenv/config';

// Import environment requirements from Jest globals
declare global {
  namespace NodeJS {
    interface Global {
      ENV_REQUIREMENTS?: {
        required: string[];
        recommended: string[];
      };
    }
  }
}

// Use environment requirements from Jest config if available, otherwise use defaults
const requirements = global.ENV_REQUIREMENTS || {
  required: ['HIVE_USERNAME'],
  recommended: [
    'HIVE_POSTING_KEY',
    'HIVE_ACTIVE_KEY',
    'HIVE_MEMO_KEY',
    'HIVE_OWNER_KEY'
  ]
};

// Environment variables state (export for use in tests)
export const ENV_STATUS = {
  missing: {
    required: requirements.required.filter(varName => !process.env[varName]),
    recommended: requirements.recommended.filter(varName => !process.env[varName])
  },
  available: {
    required: requirements.required.filter(varName => !!process.env[varName]),
    recommended: requirements.recommended.filter(varName => !!process.env[varName])
  }
};
