const path = require('path')

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/__tests__/**/*.spec.ts', '**/*.spec.ts', '**/*.test.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'babel-jest',
      {
        configFile: path.resolve(__dirname, 'babel.config.cjs'),
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/../jest-setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  clearMocks: true,
}
