import { IActivityScoringGrid } from '@crowd/types'
import { DiscourseActivityType } from './types'

export const DISCOURSE_GRID: Record<DiscourseActivityType, IActivityScoringGrid> = {
  [DiscourseActivityType.CREATE_TOPIC]: {
    score: 8,
    isContribution: true,
  },
  [DiscourseActivityType.MESSAGE_IN_TOPIC]: {
    score: 6,
    isContribution: true,
  },
  [DiscourseActivityType.JOIN]: {
    score: 3,
    isContribution: false,
  },
  [DiscourseActivityType.LIKE]: {
    score: 1,
    isContribution: false,
  },
}
