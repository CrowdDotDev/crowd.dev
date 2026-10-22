import axios from 'axios'
import { describe, expect, it } from 'vitest'

import {
  githubResolveSkipReason,
  lifecycleSkipReasonFor,
  rateLimitResetAt,
} from './githubSkipReasons'

describe('github skip reasons', () => {
  it('maps each stage and distinguishes a missing repo from a github failure', () => {
    const httpError = (status: number, headers: Record<string, string> = {}) =>
      new axios.AxiosError('failed', undefined, undefined, undefined, {
        status,
        headers,
      } as never)
    expect(githubResolveSkipReason(httpError(404))).toBe('repo_not_found')
    expect(githubResolveSkipReason(httpError(500))).toBe('github_error')
    expect(githubResolveSkipReason(new Error('boom'))).toBe('github_error')
    expect(lifecycleSkipReasonFor('resolve', httpError(404))).toBe('repo_not_found')
    expect(lifecycleSkipReasonFor('resolve', httpError(500))).toBe('github_error')
    expect(lifecycleSkipReasonFor('mint', httpError(404))).toBe('token_mint_failed')
    expect(githubResolveSkipReason(httpError(429))).toBe('rate_limited')
    const limited = httpError(403, {
      'x-ratelimit-remaining': '0',
      'x-ratelimit-reset': '1800000000',
    })
    expect(githubResolveSkipReason(limited)).toBe('rate_limited')
    expect(rateLimitResetAt(limited)).toEqual(new Date(1800000000 * 1000))
    expect(githubResolveSkipReason(httpError(403))).toBe('github_error')
    expect(rateLimitResetAt(httpError(403))).toBeNull()
    expect(lifecycleSkipReasonFor('list', httpError(404))).toBe('github_error')
  })
})
