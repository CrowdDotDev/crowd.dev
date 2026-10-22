import axios from 'axios'

import type { LifecycleSkipReason } from './githubLifecycle'

function responseHeader(err: unknown, name: string): string | undefined {
  if (!axios.isAxiosError(err)) {
    return undefined
  }
  const value = err.response?.headers?.[name]
  return value === undefined || value === null ? undefined : String(value)
}

function isRateLimited(err: unknown): boolean {
  if (!axios.isAxiosError(err)) {
    return false
  }
  const status = err.response?.status
  if (status === 429) {
    return true
  }
  return (
    status === 403 &&
    (responseHeader(err, 'x-ratelimit-remaining') === '0' ||
      responseHeader(err, 'retry-after') !== undefined)
  )
}

export function rateLimitResetAt(err: unknown): Date | null {
  const retryAfter = Number(responseHeader(err, 'retry-after'))
  if (Number.isFinite(retryAfter) && responseHeader(err, 'retry-after') !== undefined) {
    return new Date(Date.now() + retryAfter * 1000)
  }
  const reset = Number(responseHeader(err, 'x-ratelimit-reset'))
  if (Number.isFinite(reset) && responseHeader(err, 'x-ratelimit-reset') !== undefined) {
    return new Date(reset * 1000)
  }
  return null
}

export function githubResolveSkipReason(
  err: unknown,
): 'repo_not_found' | 'rate_limited' | 'github_error' {
  if (isRateLimited(err)) {
    return 'rate_limited'
  }
  return axios.isAxiosError(err) && err.response?.status === 404 ? 'repo_not_found' : 'github_error'
}

export function lifecycleSkipReasonFor(
  stage: 'mint' | 'resolve' | 'list',
  err: unknown,
): LifecycleSkipReason {
  switch (stage) {
    case 'mint':
      return 'token_mint_failed'
    case 'resolve':
      return githubResolveSkipReason(err)
    case 'list':
      return 'github_error'
  }
}
