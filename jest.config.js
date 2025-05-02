/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    transform: {
        '^.+\.tsx?$': ['ts-jest', {}],
    },
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'],
    setupFiles: ['<rootDir>/test/setupEnv.ts'],
}
