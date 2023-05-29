import { gridEntry } from './grid'

export class DiscourseGrid {
  static create_topic: gridEntry = {
    score: 8,
    isContribution: true,
  }

  static message_in_topic: gridEntry = {
    score: 6,
    isContribution: true,
  }

  static join: gridEntry = {
    score: 3,
    isContribution: false,
  }

  static like: gridEntry = {
    score: 1,
    isContribution: false,
  }
}
