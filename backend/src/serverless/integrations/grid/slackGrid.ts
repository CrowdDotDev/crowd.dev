import { gridEntry } from './grid'

export class SlackGrid {
  static join: gridEntry = {
    score: 3,
    isKeyAction: false,
  }

  static message: gridEntry = {
    score: 6,
    isKeyAction: true,
  }
}
