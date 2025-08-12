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

jest.mock('lodash.isarray', () => require('lodash/isArray'), { virtual: true })
jest.mock('lodash.set', () => require('lodash/set'), { virtual: true })
jest.mock('lodash.unionwith', () => require('lodash/unionWith'), { virtual: true })
jest.mock('lodash.sum', () => require('lodash/sum'), { virtual: true })
