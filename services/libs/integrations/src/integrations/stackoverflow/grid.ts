import { IActivityScoringGrid } from '@crowd/types'
import { StackOverflowActivityType } from './types'

export const STACKOVERFLOW_GRID: Record<StackOverflowActivityType, IActivityScoringGrid> = {
  [StackOverflowActivityType.QUESTION]: {
    score: 10,
    isContribution: true,
  },
  [StackOverflowActivityType.ANSWER]: {
    score: 6,
    isContribution: true,
  },
}
