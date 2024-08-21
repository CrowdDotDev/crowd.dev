// grid.ts content
import { IActivityScoringGrid } from '@crowd/types'
import { GitlabActivityType } from './types'

export const GITLAB_GRID: Record<GitlabActivityType, IActivityScoringGrid> = {
  [GitlabActivityType.ISSUE_OPENED]: {
    score: 2,
    isContribution: true,
  },
  [GitlabActivityType.ISSUE_CLOSED]: {
    score: 2,
    isContribution: true,
  },
  [GitlabActivityType.MERGE_REQUEST_CLOSED]: {
    score: 3,
    isContribution: true,
  },
  [GitlabActivityType.MERGE_REQUEST_OPENED]: {
    score: 3,
    isContribution: true,
  },
  [GitlabActivityType.MERGE_REQUEST_REVIEW_REQUESTED]: {
    score: 1,
    isContribution: true,
  },
  [GitlabActivityType.MERGE_REQUEST_REVIEW_APPROVED]: {
    score: 1,
    isContribution: true,
  },
  [GitlabActivityType.MERGE_REQUEST_REVIEW_CHANGES_REQUESTED]: {
    score: 1,
    isContribution: true,
  },
  [GitlabActivityType.MERGE_REQUEST_ASSIGNED]: {
    score: 1,
    isContribution: true,
  },
  [GitlabActivityType.MERGE_REQUEST_MERGED]: {
    score: 3,
    isContribution: true,
  },
  [GitlabActivityType.MERGE_REQUEST_COMMENT]: {
    score: 1,
    isContribution: true,
  },
  [GitlabActivityType.ISSUE_COMMENT]: {
    score: 1,
    isContribution: true,
  },
  [GitlabActivityType.AUTHORED_COMMIT]: {
    score: 1,
    isContribution: true,
  },

  [GitlabActivityType.STAR]: {
    score: 1,
    isContribution: true,
  },
  [GitlabActivityType.FORK]: {
    score: 1,
    isContribution: true,
  },
}
