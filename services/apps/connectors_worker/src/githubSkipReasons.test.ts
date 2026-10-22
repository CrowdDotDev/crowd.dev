import axios from 'axios'
import { describe, expect, it } from 'vitest'

import { githubResolveSkipReason, lifecycleSkipReasonFor } from './githubSkipReasons'

describe('github skip reasons', () => {
  it('maps each stage and distinguishes a missing repo from a github failure', () => {
    const httpError = (status: number) =>
      new axios.AxiosError('failed', undefined, undefined, undefined, {
        status,
      } as never)
    expect(githubResolveSkipReason(httpError(404))).toBe('repo_not_found')
    expect(githubResolveSkipReason(httpError(500))).toBe('github_error')
    expect(githubResolveSkipReason(new Error('boom'))).toBe('github_error')
    expect(lifecycleSkipReasonFor('resolve', httpError(404))).toBe('repo_not_found')
    expect(lifecycleSkipReasonFor('resolve', httpError(500))).toBe('github_error')
    expect(lifecycleSkipReasonFor('mint', httpError(404))).toBe('token_mint_failed')
    expect(lifecycleSkipReasonFor('list', httpError(404))).toBe('github_error')
  })
})
