import { IActivityScoringGrid } from '@crowd/types'
import { HackerNewsActivityType } from './types'

export const HACKERNEWS_GRID: Record<HackerNewsActivityType, IActivityScoringGrid> = {
  [HackerNewsActivityType.POST]: {
    score: 10,
    isContribution: true,
  },
  [HackerNewsActivityType.COMMENT]: {
    score: 6,
    isContribution: true,
  },
}
