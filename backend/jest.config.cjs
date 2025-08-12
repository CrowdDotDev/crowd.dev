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
  moduleNameMapper: {
    '^config$': '<rootDir>/services/__tests__/stubs/config.js',
    '^lodash\\.isarray$': 'lodash/isArray',
    '^lodash\\.set$': 'lodash/set',
    '^lodash\\.unionwith$': 'lodash/unionWith',
    '^lodash\\.sum$': 'lodash/sum',
    '^@octokit/rest$': '<rootDir>/services/__tests__/stubs/octokit.rest.stub.js',
    '^@octokit/request$': '<rootDir>/services/__tests__/stubs/octokit.request.stub.js',
    '^@octokit/graphql$': '<rootDir>/services/__tests__/stubs/octokit.graphql.stub.js',
    '^@/(.*)$': '<rootDir>/$1',
  },
  clearMocks: true,
}
