export enum GithubActivityType {
  DISCUSSION_STARTED = 'discussion-started',
  PULL_REQUEST_OPENED = 'pull_request-opened',
  PULL_REQUEST_CLOSED = 'pull_request-closed',
  PULL_REQUEST_REVIEW_REQUESTED = 'pull_request-review-requested',
  PULL_REQUEST_REVIEWED = 'pull_request-reviewed',
  PULL_REQUEST_ASSIGNED = 'pull_request-assigned',
  PULL_REQUEST_MERGED = 'pull_request-merged',
  ISSUE_OPENED = 'issues-opened',
  ISSUE_CLOSED = 'issues-closed',
  FORK = 'fork',
  STAR = 'star',
  UNSTAR = 'unstar',
  PULL_REQUEST_COMMENT = 'pull_request-comment',
  PULL_REQUEST_REVIEW_THREAD_COMMENT = 'pull_request-review-thread-comment',
  ISSUE_COMMENT = 'issue-comment',
  DISCUSSION_COMMENT = 'discussion-comment',
  AUTHORED_COMMIT = 'authored-commit',
}

export enum GithubStreamType {
  ROOT = 'root',
  STARGAZERS = 'stargazers',
  FORKS = 'forks',
  PULLS = 'pulls',
  PULL_COMMENTS = 'pull-comments',
  PULL_REVIEW_THREADS = 'pull-review-threads',
  PULL_REVIEW_THREAD_COMMENTS = 'pull-review-thread-comments',
  PULL_COMMITS = 'pull-commits',
  ISSUES = 'issues',
  ISSUE_COMMENTS = 'issue-comments',
  DISCUSSIONS = 'discussions',
  DISCUSSION_COMMENTS = 'discussion-comments',
}

export interface GithubApiData {
  type: GithubActivityType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[] | any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  member: GithubParseMemberOutput
  objectMember?: GithubParseMemberOutput
  sourceParentId?: string
  repo: Repo
}

export interface GithubStreamBase {
  isCommitDataEnabled: boolean
  privateKey: string
}

export interface GithubRootStream extends GithubStreamBase {
  reposToCheck: Repos
}

export interface GithubBasicStream extends GithubStreamBase {
  repo: Repo
  page: string
  prNumber?: string
  reviewThreadId?: string
  issueNumber?: string
  discussionNumber?: string
}

export interface GithubPlatformSettings {
  appId: string
  clientId: string
  clientSecret: string
  privateKey: string
  webhookSecret: string
  isCommitDataEnabled: string
  globalLimit?: number
  callbackUrl: string
}

export interface GithubIntegrationSettings {
  repos: Repos
  unavailableRepos: Repos
}

export enum GithubPullRequestEvents {
  REQUEST_REVIEW = 'ReviewRequestedEvent',
  REVIEW = 'PullRequestReview',
  ASSIGN = 'AssignedEvent',
  MERGE = 'MergedEvent',
  CLOSE = 'ClosedEvent',
}

export type Repo = {
  url: string
  name: string
  createdAt: string
  owner: string
  available?: boolean
  fork?: boolean
  private?: boolean
  cloneUrl?: string
}

export type Repos = Array<Repo>

export type Endpoint = string

export type Endpoints = Array<Endpoint>

export type State = {
  endpoints: Endpoints
  endpoint: string
  page: string
}

export interface AppTokenResponse {
  token: string
  expiresAt: string
}

export interface GithubParseMemberOutput {
  email: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orgs: any
}
