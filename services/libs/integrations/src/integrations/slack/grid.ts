import { IActivityScoringGrid } from '@crowd/types'
import { SlackActivityType } from './types'

export const SLACK_GRID: Record<SlackActivityType, IActivityScoringGrid> = {
  [SlackActivityType.JOINED_CHANNEL]: {
    score: 3,
    isContribution: false,
  },
  [SlackActivityType.MESSAGE]: {
    score: 6,
    isContribution: true,
  },
}
