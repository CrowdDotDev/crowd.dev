/* eslint-env jest, node */
/* eslint-disable class-methods-use-this */

/**
 * 🔧 Default mocks for the Jest testing environment.
 *
 * These mocks are automatically loaded before each test.
 * Remember: you can override them in specific tests using `jest.spyOn` or `jest.mock` again.
 */

// -------------------------
// Mock for the `config` package
// -------------------------
jest.mock('config', () => {
  // Default values used for the mocked config
  const DEFAULTS = {
    queue: { host: 'localhost', port: 1234, ssl: false },
  }

  // Helper to get a nested value from an object using a path like "queue.host"
  const getPath = (obj, path) =>
    String(path)
      .split('.')
      .filter(Boolean)
      .reduce((cur, k) => (cur && k in cur ? cur[k] : undefined), obj)

  // Mocked `config` API
  const api = {
    get: (key) => getPath(DEFAULTS, key) ?? {},
    has: (key) => getPath(DEFAULTS, key) !== undefined,
    __set: (obj) => Object.assign(DEFAULTS, obj), // Allows overriding defaults inside tests
  }

  return api
})

// -------------------------
// Mocks for @octokit
// -------------------------
jest.mock('@octokit/request', () => ({ request: () => Promise.resolve({}) }))

jest.mock('@octokit/rest', () => ({
  Octokit: class {
    request() {
      return Promise.resolve({})
    }
  },
}))

jest.mock('@octokit/graphql', () => {
  const base = () => Promise.resolve({})
  base.defaults = () => base
  return { graphql: base }
})

// -------------------------
// Mocks for specific lodash methods
// -------------------------
const lodashIsArray = require('lodash/isArray')
const lodashSet = require('lodash/set')
const lodashUnionWith = require('lodash/unionWith')
const lodashSum = require('lodash/sum')

jest.mock('lodash.isarray', () => lodashIsArray, { virtual: true })
jest.mock('lodash.set', () => lodashSet, { virtual: true })
jest.mock('lodash.unionwith', () => lodashUnionWith, { virtual: true })
jest.mock('lodash.sum', () => lodashSum, { virtual: true })
