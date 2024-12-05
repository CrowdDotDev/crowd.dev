/* eslint-disable  @typescript-eslint/no-explicit-any */
export enum GithubActivityType {
  PULL_REQUEST_OPENED = 'pull_request-opened',
  PULL_REQUEST_CLOSED = 'pull_request-closed',
  // PULL_REQUEST_REVIEW_REQUESTED = 'pull_request-review-requested',
  PULL_REQUEST_REVIEWED = 'pull_request-reviewed',
  // PULL_REQUEST_ASSIGNED = 'pull_request-assigned',
  PULL_REQUEST_MERGED = 'pull_request-merged',
  ISSUE_OPENED = 'issues-opened',
  ISSUE_CLOSED = 'issues-closed',
  FORK = 'fork',
  STAR = 'star',
  PULL_REQUEST_COMMENT = 'pull_request-comment',
  // PULL_REQUEST_REVIEW_THREAD_COMMENT = 'pull_request-review-thread-comment',
  ISSUE_COMMENT = 'issue-comment',
  AUTHORED_COMMIT = 'authored-commit',
}

export interface GithubPullRequest {
  state: string
  title: string
  id: string
  url: string
  createdAt: string
  number: string
  additions: number
  deletions: number
  changedFiles: number
  authorAssociation: string
  labels?: {
    nodes?: any[]
  }
  bodyText: string
}

export interface GithubIssue {
  state: string
  title: string
  id: string
  url: string
  createdAt: string
  bodyText: string
}

export interface GithubPullRequestTimelineItem {
  __typename: string
  id: string
  actor: any
  createdAt: string
  assignee?: any
  submittedAt?: string
  body?: string
  state?: string
}

export interface GithubIssueTimelineItem {
  __typename: string
  id: string
  actor?: any
  createdAt: string
}

export interface GithubWebhookPayload {
  signature: string
  event: any
  data: any
  date?: string
}

export enum GithubActivitySubType {
  PULL_REQUEST_REVIEW_REQUESTED_SINGLE = 'pull_request-review-requested-single',
  PULL_REQUEST_REVIEW_REQUESTED_MULTIPLE = 'pull_request-review-requested-multiple',
  DISCUSSION_COMMENT_START = 'discussion-comment-start',
  DISCUSSION_COMMENT_REPLY = 'discussion-comment-reply',
}

export enum GithubWebhookSubType {
  DISCUSSION_COMMENT_START = 'discussion-comment-start',
  DISCUSSION_COMMENT_REPLY = 'discussion-comment-reply',
}

export enum GithubStreamType {
  ROOT = 'root',
  STARGAZERS = 'stargazers',
  FORKS = 'forks',
  PULLS = 'pulls',
  PULL_COMMENTS = 'pull-comments',
  PULL_COMMITS = 'pull-commits',
  PULL_REVIEWS = 'pull-reviews',
  ISSUES = 'issues',
  ISSUE_COMMENTS = 'issue-comments',
}

export enum GithubManualStreamType {
  ALL = 'all',
  STARGAZERS = 'stargazers',
  FORKS = 'forks',
  PULLS = 'pulls',
  ISSUES = 'issues',
}

export const INDIRECT_FORK = 'indirect-fork'

export interface GithubApiData {
  type: GithubActivityType
  subType?: string
  data: any[] | any
  relatedData?: any | any[]
  member?: GithubPrepareMemberOutput
  orgMember?: GithubPrepareOrgMemberOutput
  objectMember?: GithubPrepareMemberOutput
  sourceParentId?: string
  repo: Repo
}

export interface GithubRootStream {
  reposToCheck: Repos
}

export interface GithubBasicStream {
  repo: Repo
  sf_repo_id: string
  page: number
  prNumber?: string
  reviewThreadId?: string
  issueNumber?: string
  discussionNumber?: string
}

export interface GithubPlatformSettings {
  privateKey: string
  account: string
  username: string
  database: string
  warehouse: string
  role: string
}

export interface GithubIntegrationSettings {
  orgs: Array<{
    name: string
    logo: string
    url: string
    fullSync: boolean
    updatedAt: string
    repos: Array<Repo>
  }>
}

export interface GitHubManualIntegrationSettingsDefault extends GithubIntegrationSettings {
  manualSettingsType: 'default'
  streamType: GithubManualStreamType
}

export interface GitHubManualIntegrationSettingsDetailedMap extends GithubIntegrationSettings {
  manualSettingsType: 'detailed_map'
  map: object
}

export type GithubManualIntegrationSettings =
  | GitHubManualIntegrationSettingsDefault
  | GitHubManualIntegrationSettingsDetailedMap

export enum GithubPullRequestEvents {
  REQUEST_REVIEW = 'ReviewRequestedEvent',
  REVIEW = 'PullRequestReview',
  ASSIGN = 'AssignedEvent',
  MERGE = 'MergedEvent',
  CLOSE = 'ClosedEvent',
}

export type Repo = {
  name: string
  url: string
  updatedAt: string
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

export interface GithubPrepareMemberOutput {
  email: string
  org: {
    id: string
    login: string
    avatarUrl: string
  }
  memberFromApi: {
    id: string
    login: string
    avatarUrl: string
    isBot?: boolean
    isDeleted?: boolean
    name?: string
    bio?: string
    location?: string
    company?: string
    url?: string
    isHireable?: boolean
    twitterUsername?: string
    websiteUrl?: string
  }
}

export interface GithubBotMember {
  login: string
  avatarUrl: string
  avatar_url?: string
  id: string
  url: string
}

export interface GithubPrepareOrgMemberOutput {
  orgFromApi: any
}
