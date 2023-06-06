import { IActivityScoringGrid } from '@crowd/types'
import { GithubActivityType } from './types'

export const GITHUB_GRID: Record<GithubActivityType, IActivityScoringGrid> = {
  [GithubActivityType.DISCUSSION_STARTED]: {
    score: 8,
    isContribution: true,
  },
  [GithubActivityType.DISCUSSION_COMMENT]: {
    score: 6,
    isContribution: true,
  },
  [GithubActivityType.FORK]: {
    score: 4,
    isContribution: false,
  },
  [GithubActivityType.ISSUE_CLOSED]: {
    score: 6,
    isContribution: true,
  },
  [GithubActivityType.ISSUE_OPENED]: {
    score: 8,
    isContribution: true,
  },
  [GithubActivityType.ISSUE_COMMENT]: {
    score: 6,
    isContribution: true,
  },
  [GithubActivityType.PULL_REQUEST_CLOSED]: {
    score: 8,
    isContribution: true,
  },
  [GithubActivityType.PULL_REQUEST_OPENED]: {
    score: 10,
    isContribution: true,
  },
  [GithubActivityType.PULL_REQUEST_COMMENT]: {
    score: 6,
    isContribution: true,
  },
  [GithubActivityType.STAR]: {
    score: 2,
    isContribution: false,
  },
  [GithubActivityType.UNSTAR]: {
    score: -2,
    isContribution: false,
  },
  [GithubActivityType.PULL_REQUEST_MERGED]: {
    score: 6,
    isContribution: true,
  },
  [GithubActivityType.PULL_REQUEST_ASSIGNED]: {
    score: 2,
    isContribution: false,
  },
  [GithubActivityType.PULL_REQUEST_REVIEWED]: {
    score: 8,
    isContribution: true,
  },
  [GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED]: {
    score: 2,
    isContribution: false,
  },
  [GithubActivityType.PULL_REQUEST_REVIEW_THREAD_COMMENT]: {
    score: 6,
    isContribution: true,
  },
}
