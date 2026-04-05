/** Jest configuration for the Finance Backend */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/seed.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};
