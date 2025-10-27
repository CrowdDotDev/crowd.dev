// grid.ts content
import { IActivityScoringGrid } from '@crowd/types'

import { GroupsioActivityType } from './types'

export const Groupsio_GRID: Record<GroupsioActivityType, IActivityScoringGrid> = {
  [GroupsioActivityType.MEMBER_JOIN]: {
    score: 2,
  },
  [GroupsioActivityType.MESSAGE]: {
    score: 6,
  },
  [GroupsioActivityType.MEMBER_LEAVE]: {
    score: -2,
  },
}
