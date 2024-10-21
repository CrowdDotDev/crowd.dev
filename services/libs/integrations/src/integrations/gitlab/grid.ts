import { IActivityScoringGrid } from '@crowd/types'

import { GitlabActivityType } from './types'

export const GITLAB_GRID: Record<GitlabActivityType, IActivityScoringGrid> = {
  [GitlabActivityType.ISSUE_OPENED]: {
    score: 8,
    isContribution: true,
  },
  [GitlabActivityType.ISSUE_CLOSED]: {
    score: 6,
    isContribution: true,
  },
  [GitlabActivityType.MERGE_REQUEST_CLOSED]: {
    score: 8,
    isContribution: true,
  },
  [GitlabActivityType.MERGE_REQUEST_OPENED]: {
    score: 10,
    isContribution: true,
  },
  [GitlabActivityType.MERGE_REQUEST_REVIEW_REQUESTED]: {
    score: 2,
    isContribution: false,
  },
  [GitlabActivityType.MERGE_REQUEST_REVIEW_APPROVED]: {
    score: 8,
    isContribution: true,
  },
  [GitlabActivityType.MERGE_REQUEST_REVIEW_CHANGES_REQUESTED]: {
    score: 8,
    isContribution: true,
  },
  [GitlabActivityType.MERGE_REQUEST_ASSIGNED]: {
    score: 2,
    isContribution: false,
  },
  [GitlabActivityType.MERGE_REQUEST_MERGED]: {
    score: 6,
    isContribution: true,
  },
  [GitlabActivityType.MERGE_REQUEST_COMMENT]: {
    score: 6,
    isContribution: true,
  },
  [GitlabActivityType.ISSUE_COMMENT]: {
    score: 6,
    isContribution: true,
  },
  [GitlabActivityType.AUTHORED_COMMIT]: {
    score: 2,
    isContribution: true,
  },
  [GitlabActivityType.STAR]: {
    score: 2,
    isContribution: false,
  },
  [GitlabActivityType.FORK]: {
    score: 4,
    isContribution: false,
  },
}
