import axios from 'axios'

import type { LifecycleSkipReason } from './githubLifecycle'

export function githubResolveSkipReason(err: unknown): 'repo_not_found' | 'github_error' {
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
