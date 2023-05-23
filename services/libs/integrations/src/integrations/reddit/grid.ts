import { IActivityScoringGrid } from '@crowd/types'
import { RedditActivityType } from './types'

export const REDDIT_GRID: Record<RedditActivityType, IActivityScoringGrid> = {
  [RedditActivityType.POST]: {
    score: 10,
    isContribution: true,
  },
  [RedditActivityType.COMMENT]: {
    score: 6,
    isContribution: true,
  },
}
