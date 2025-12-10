import { IActivityScoringGrid } from '@crowd/types'

import { TwitterActivityType } from './types'

export const TWITTER_GRID: Record<TwitterActivityType, IActivityScoringGrid> = {
  [TwitterActivityType.HASHTAG]: {
    score: 6,
  },
  [TwitterActivityType.MENTION]: {
    score: 6,
  },
  [TwitterActivityType.FOLLOW]: {
    score: 2,
  },
}
