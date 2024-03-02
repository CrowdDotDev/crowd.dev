// grid.ts content
import { IActivityScoringGrid } from '@crowd/types'
import { YoutubeActivityType } from './types'

export const Youtube_GRID: Record<YoutubeActivityType, IActivityScoringGrid> = {
  [YoutubeActivityType.COMMENT]: {
    score: 6,
    isContribution: true
  }
}
