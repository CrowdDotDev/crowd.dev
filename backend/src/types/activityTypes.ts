export enum GithubActivityType {
  DISCUSSION_STARTED = 'discussion-started',
  PULL_REQUEST_OPENED = 'pull_request-opened',
  PULL_REQUEST_CLOSED = 'pull_request-closed',
  ISSUE_OPENED = 'issues-opened',
  ISSUE_CLOSED = 'issues-closed',
  FORK = 'fork',
  STAR = 'star',
  UNSTAR = 'unstar',
  PULL_REQUEST_COMMENT = 'pull_request-comment',
  ISSUE_COMMENT = 'issue-comment',
  DISCUSSION_COMMENT = 'discussion-comment',
}

export enum HackerNewsActivityType {
  POST = 'post',
  COMMENT = 'comment',
}

export enum RedditActivityType {
  POST = 'post',
  COMMENT = 'comment',
}