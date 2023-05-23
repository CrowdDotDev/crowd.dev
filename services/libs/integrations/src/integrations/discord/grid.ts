import { IActivityScoringGrid } from '@crowd/types'
import { DiscordActivityType } from './types'

export const DISCORD_GRID: Record<DiscordActivityType, IActivityScoringGrid> = {
  [DiscordActivityType.JOINED_GUILD]: {
    score: 3,
    isContribution: false,
  },
  [DiscordActivityType.MESSAGE]: {
    score: 6,
    isContribution: true,
  },
  [DiscordActivityType.THREAD_STARTED]: {
    score: 6,
    isContribution: true,
  },
  [DiscordActivityType.THREAD_MESSAGE]: {
    score: 6,
    isContribution: true,
  },
}
