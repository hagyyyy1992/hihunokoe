const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)'],
  testPathIgnorePatterns: ['__tests__/helpers/', 'e2e/', 'playwright-report/', 'test-results/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'api/src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!api/src/**/__tests__/**',
  ],
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@api/(.*)$': '<rootDir>/api/src/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
