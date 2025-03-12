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
  // This setting is critical for handling ES module imports
  transformIgnorePatterns: [
    'node_modules/(?!(@hiveio)/)'
  ],
  // Add this if you still have issues with ES modules
  globals: {
    'ts-jest': {
      useESM: false,
    },
  },
};
