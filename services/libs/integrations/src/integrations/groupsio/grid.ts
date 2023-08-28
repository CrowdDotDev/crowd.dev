// grid.ts content
import { IActivityScoringGrid } from '@crowd/types'
import { GroupsioActivityType } from './types'

export const Groupsio_GRID: Record<GroupsioActivityType, IActivityScoringGrid> = {
  [GroupsioActivityType.MEMBER_JOIN]: {
    score: 2,
    isContribution: false,
  },
  [GroupsioActivityType.MESSAGE]: {
    score: 6,
    isContribution: true,
  },
  [GroupsioActivityType.MEMBER_LEAVE]: {
    score: -2,
    isContribution: false,
  },
}
