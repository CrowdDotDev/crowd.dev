import { gridEntry } from './grid'

/**
 * Class that holds the Twitter grid for scores and isContributions
 */
export class TwitterGrid {
  static mention: gridEntry = {
    score: 6,
    isContribution: true,
  }

  static hashtag: gridEntry = {
    score: 6,
    isContribution: true,
  }

  static follow: gridEntry = {
    score: 2,
    isContribution: false,
  }
}
