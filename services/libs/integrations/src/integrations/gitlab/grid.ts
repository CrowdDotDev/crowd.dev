// grid.ts content
import { IActivityScoringGrid } from '@crowd/types'
import { GitlabActivityType } from './types'

export const Gitlab_GRID: Record<GitlabActivityType, IActivityScoringGrid> = {
  [GitlabActivityType.ISSUE]: {
    score: 2,
    isContribution: true,
  },
  [GitlabActivityType.MERGE_REQUEST]: {
    score: 3,
    isContribution: true,
  },
  [GitlabActivityType.COMMIT]: {
    score: 1,
    isContribution: true,
  },
  [GitlabActivityType.DISCUSSION]: {
    score: 1,
    isContribution: true,
  },
}
