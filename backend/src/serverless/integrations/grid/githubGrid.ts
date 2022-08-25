import { gridEntry } from './grid'

export class GitHubGrid {
  static discussionOpened: gridEntry = {
    score: 8,
    isKeyAction: true,
  }

  static issueClosed: gridEntry = {
    score: 6,
    isKeyAction: true,
  }

  static issueOpened: gridEntry = {
    score: 8,
    isKeyAction: true,
  }

  static comment: gridEntry = {
    score: 6,
    isKeyAction: true,
  }

  static selectedAnswer: gridEntry = {
    score: 8,
    isKeyAction: true,
  }

  static pullRequestOpened: gridEntry = {
    score: 10,
    isKeyAction: true,
  }

  static pullRequestClosed: gridEntry = {
    score: 8,
    isKeyAction: true,
  }

  static star: gridEntry = {
    score: 2,
    isKeyAction: false,
  }

  static unStar: gridEntry = {
    score: -2,
    isKeyAction: false,
  }

  static fork: gridEntry = {
    score: 4,
    isKeyAction: true,
  }
}
