// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 15000, // 15 seconds timeout for tests with API calls
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }],
  },
  testMatch: [
    '**/tests/**/*.test.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    // Map root imports to their actual paths
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
