// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 15000, // 15 seconds timeout for tests with API calls
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
      useESM: false
    }],
  },
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*-test.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    // Map root imports to their actual paths
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@hiveio)/)'
  ],
  globals: {
    ENV_REQUIREMENTS: {
      required: ['HIVE_USERNAME'],
      recommended: [
        'HIVE_POSTING_KEY',
        'HIVE_ACTIVE_KEY',
        'HIVE_MEMO_KEY',
        'HIVE_OWNER_KEY',
        'TEST_PRIVATE_KEY'
      ]
    }
  },
  reporters: [
    'default',
    ['<rootDir>/tests/env-reporter.js', {}]
  ],
};
