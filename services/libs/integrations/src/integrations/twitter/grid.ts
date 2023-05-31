import { IActivityScoringGrid } from '@crowd/types'
import { TwitterActivityType } from './types'

export const TWITTER_GRID: Record<TwitterActivityType, IActivityScoringGrid> = {
  [TwitterActivityType.HASHTAG]: {
    score: 6,
    isContribution: true,
  },
  [TwitterActivityType.MENTION]: {
    score: 6,
    isContribution: true,
  },
  [TwitterActivityType.FOLLOW]: {
    score: 2,
    isContribution: false,
  },
}
