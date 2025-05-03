/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    // Use ts-jest preset for TypeScript support
    preset: 'ts-jest',
    // Node environment for backend integration tests
    testEnvironment: 'node',
    // Only run integration test files (naming convention: *.integration.test.ts)
    testMatch: ['**/__tests__/**/*.integration.test.ts'],
    // Bootstrap environment variables before tests
    setupFiles: ['<rootDir>/test/setupEnv.ts'],
    // Increase timeout for potentially slow integration tests
    testTimeout: 30000,
};
