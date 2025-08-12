const path = require('path')

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/__tests__/**/*.spec.ts', '**/*.spec.ts', '**/*.test.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', {
      configFile: path.resolve(__dirname, 'babel.config.cjs'),
    }],
  },
  moduleNameMapper: {
    '^lodash\\.isarray$': 'lodash/isArray',
    '^lodash\\.set$': 'lodash/set',
    '^lodash\\.unionwith$': 'lodash/unionWith',
    '^lodash\\.sum$': 'lodash/sum',
    '^@/(.*)$': '<rootDir>/$1',
  },
  clearMocks: true,
}
