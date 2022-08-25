import { gridEntry } from './grid'

/**
 * Class that holds the Twitter grid for scores and isKeyActions
 */
export class TwitterGrid {
  static mention: gridEntry = {
    score: 6,
    isKeyAction: true,
  }

  static hashtag: gridEntry = {
    score: 6,
    isKeyAction: true,
  }

  static follow: gridEntry = {
    score: 2,
    isKeyAction: false,
  }
}
