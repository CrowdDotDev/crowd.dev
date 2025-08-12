/* eslint-env jest, node */
/* eslint-disable class-methods-use-this */
jest.mock('config', () => {
  const DEFAULTS = {
    queue: { host: 'localhost', port: 1234, ssl: false },
    encryption: { secretKey: 'default', initVector: 'default' },
    redis: { username: 'default', password: 'default', host: 'localhost', port: 6379 },
  }
  const getPath = (obj, path) =>
    String(path)
      .split('.')
      .filter(Boolean)
      .reduce((cur, k) => (cur && k in cur ? cur[k] : undefined), obj)
  const api = {
    get: (key) => getPath(DEFAULTS, key) ?? {},
    has: (key) => getPath(DEFAULTS, key) !== undefined,
    __set: (obj) => Object.assign(DEFAULTS, obj),
  }
  return api
})

jest.mock('@octokit/rest', () => ({
  Octokit: class {
    request() {
      return Promise.resolve({})
    }
  },
}))
jest.mock('@octokit/request', () => ({ request: () => Promise.resolve({}) }))
jest.mock('@octokit/graphql', () => {
  const base = () => Promise.resolve({})
  base.defaults = () => base
  return { graphql: base }
})

const lodashIsArray = require('lodash/isArray')
const lodashSet = require('lodash/set')
const lodashUnionWith = require('lodash/unionWith')
const lodashSum = require('lodash/sum')

jest.mock('lodash.isarray', () => lodashIsArray, { virtual: true })
jest.mock('lodash.set', () => lodashSet, { virtual: true })
jest.mock('lodash.unionwith', () => lodashUnionWith, { virtual: true })
jest.mock('lodash.sum', () => lodashSum, { virtual: true })
