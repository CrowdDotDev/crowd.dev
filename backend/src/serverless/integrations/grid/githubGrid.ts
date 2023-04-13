import { gridEntry } from './grid'

export class GitHubGrid {
  static discussionOpened: gridEntry = {
    score: 8,
    isContribution: true,
  }

  static issueClosed: gridEntry = {
    score: 6,
    isContribution: true,
  }

  static issueOpened: gridEntry = {
    score: 8,
    isContribution: true,
  }

  static comment: gridEntry = {
    score: 6,
    isContribution: true,
  }

  static selectedAnswer: gridEntry = {
    score: 8,
    isContribution: true,
  }

  static pullRequestOpened: gridEntry = {
    score: 10,
    isContribution: true,
  }

  static pullRequestClosed: gridEntry = {
    score: 8,
    isContribution: true,
  }

  static star: gridEntry = {
    score: 2,
    isContribution: false,
  }

  static unStar: gridEntry = {
    score: -2,
    isContribution: false,
  }

  static fork: gridEntry = {
    score: 4,
    isContribution: false,
  }

  static pullRequestAssigned: gridEntry = {
    score: 2,
    isContribution: false,
  }

  static pullRequestReviewRequested: gridEntry = {
    score: 2,
    isContribution: false,
  }

  static pullRequestReviewed: gridEntry = {
    score: 8,
    isContribution: true,
  }

  static pullRequestMerged: gridEntry = {
    score: 6,
    isContribution: true,
  }
}
