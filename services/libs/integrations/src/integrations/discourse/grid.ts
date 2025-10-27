import { IActivityScoringGrid } from '@crowd/types'

import { DiscourseActivityType } from './types'

export const DISCOURSE_GRID: Record<DiscourseActivityType, IActivityScoringGrid> = {
  [DiscourseActivityType.CREATE_TOPIC]: {
    score: 8,
  },
  [DiscourseActivityType.MESSAGE_IN_TOPIC]: {
    score: 6,
  },
  [DiscourseActivityType.JOIN]: {
    score: 3,
  },
  [DiscourseActivityType.LIKE]: {
    score: 1,
  },
}
