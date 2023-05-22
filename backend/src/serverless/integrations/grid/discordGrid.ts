import { gridEntry } from './grid'

export class DiscordGrid {
  static join: gridEntry = {
    score: 3,
    isContribution: false,
  }

  static message: gridEntry = {
    score: 6,
    isContribution: true,
  }

  static topic: gridEntry = {
    score: 8,
    isContribution: true,
  }
}
