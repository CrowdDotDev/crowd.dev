import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Logger } from '@crowd/logging'

import type { ConnectorHttp } from '../../http/client'
import { ProviderContractError } from '../../http/errors'
import { githubGraphql } from './gql'

const log = {
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
} as unknown as Logger

function httpReturning(responses: unknown[]): ConnectorHttp {
  let call = 0
  return {
    request: vi.fn(async () => responses[Math.min(call++, responses.length - 1)]),
    requestCount: () => call,
  } as unknown as ConnectorHttp
}

const notFound = {
  data: { repository: null },
  errors: [
    { type: 'NOT_FOUND', message: "Could not resolve to a Repository with the name 'o/r'." },
  ],
}
const resolved = { data: { repository: { issue: { comments: { nodes: [] } } } } }

describe('githubGraphql', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('retries when every root field is null alongside an error and returns the next good response', async () => {
    const http = httpReturning([notFound, resolved])

    const pending = githubGraphql(http, 'query', {}, log)
    await vi.runAllTimersAsync()

    await expect(pending).resolves.toEqual(resolved.data)
    expect(http.request).toHaveBeenCalledTimes(2)
  })

  it('throws a provider contract error once the null-root retries are exhausted', async () => {
    const http = httpReturning([notFound])

    const pending = githubGraphql(http, 'query', {}, log)
    const outcome = pending.catch((err) => err)
    await vi.runAllTimersAsync()

    await expect(outcome).resolves.toBeInstanceOf(ProviderContractError)
    expect(http.request).toHaveBeenCalledTimes(5)
  })

  it('returns partial data when at least one root field resolved', async () => {
    const partial = {
      data: { nodes: [null, { id: 'x' }] },
      errors: [{ type: 'NOT_FOUND', message: 'Could not resolve to a node' }],
    }
    const http = httpReturning([partial])

    await expect(githubGraphql(http, 'query', {}, log)).resolves.toEqual(partial.data)
    expect(http.request).toHaveBeenCalledTimes(1)
  })

  it('fails fast on a forbidden error without retrying', async () => {
    const forbidden = {
      data: { repository: null },
      errors: [{ type: 'FORBIDDEN', message: 'Resource not accessible by integration' }],
    }
    const http = httpReturning([forbidden])

    await expect(githubGraphql(http, 'query', {}, log)).rejects.toBeInstanceOf(
      ProviderContractError,
    )
    expect(http.request).toHaveBeenCalledTimes(1)
  })
})
