import { IActivityScoringGrid } from '@crowd/types'
import { LinkedinActivityType } from './types'

export const LINKEDIN_GRID: Record<LinkedinActivityType, IActivityScoringGrid> = {
  [LinkedinActivityType.COMMENT]: {
    score: 6,
    isContribution: true,
  },
  [LinkedinActivityType.REACTION]: {
    score: 1,
    isContribution: false,
  },
}
