import {
  ProjectSchema,
  UserSchema,
  ProjectStarrerSchema,
  ExpandedCommitSchema,
  IssueSchema,
  IssueNoteSchema,
  MergeRequestSchema,
  MergeRequestNoteSchema,
  DiscussionNoteSchema,
} from '@gitbeaker/rest'

export enum GitlabActivityType {
  MERGE_REQUEST_OPENED = 'merge_request-opened',
  MERGE_REQUEST_CLOSED = 'merge_request-closed',
  MERGE_REQUEST_REVIEW_REQUESTED = 'merge_request-review-requested',
  MERGE_REQUEST_REVIEW_APPROVED = 'merge_request-review-approved',
  MERGE_REQUEST_REVIEW_CHANGES_REQUESTED = 'merge_request-review-changes-requested',
  MERGE_REQUEST_ASSIGNED = 'merge_request-assigned',
  MERGE_REQUEST_MERGED = 'merge_request-merged',
  MERGE_REQUEST_COMMENT = 'merge_request-comment',
  ISSUE_OPENED = 'issues-opened',
  ISSUE_CLOSED = 'issues-closed',
  FORK = 'fork',
  STAR = 'star',
  ISSUE_COMMENT = 'issue-comment',
  AUTHORED_COMMIT = 'authored-commit',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GitlabActivityData<T = any> {
  data: T
  user?: UserSchema
  relatedUser?: UserSchema
  relatedData?: Record<string, unknown>
}

export type GitlabForkData = GitlabActivityData<ProjectSchema>
export type GitlabStarData = GitlabActivityData<ProjectStarrerSchema>
export type GitlabIssueData = GitlabActivityData<IssueSchema>
export type GitlabIssueCommentData = GitlabActivityData<IssueNoteSchema>
export type GitlabDisccusionCommentData = GitlabActivityData<DiscussionNoteSchema>
export type GitlabMergeRequestData = GitlabActivityData<MergeRequestSchema>
export type GitlabMergeRequestCommentData = GitlabActivityData<MergeRequestNoteSchema>
export type GitlabMergeRequestCommitData = GitlabActivityData<ExpandedCommitSchema>

export interface GitlabApiResult<T> {
  data: T
  nextPage: number | null
}

export interface GitlabApiData<T> {
  type: GitlabActivityType
  data: GitlabActivityData<T>
  projectId: string
  pathWithNamespace: string
}

export enum GitlabStreamType {
  ROOT = 'root',
  ISSUES = 'issues',
  ISSUE_DISCUSSIONS = 'issue_discussions',
  MERGE_REQUESTS = 'merge_requests',
  MERGE_REQUEST_EVENTS = 'merge_request_events',
  MERGE_REQUEST_DISCUSSIONS = 'merge_request_discussions',
  MERGE_REQUEST_COMMITS = 'merge_request_commits',
  COMMITS = 'commits',
  STARS = 'stars',
  FORKS = 'forks',
}

export interface GitlabRootStream {
  projects: {
    id: string
    path_with_namespace: string
  }[]
}

export interface GitlabBasicStream {
  projectId: string
  pathWithNamespace: string
  page: number
  meta?: Record<string, unknown>
}

export interface GitLabSettings {
  user: {
    id: number
    bio: string
    bot: boolean
    name: string
    email: string
    skype: string
    state: string
    locked: boolean
    discord: string
    twitter: string
    web_url: string
    external: boolean
    linkedin: string
    location: string
    pronouns: string | null
    theme_id: number
    username: string
    job_title: string
    avatar_url: string
    created_at: string
    identities: Array<{
      provider: string
      extern_uid: string
      saml_provider_id: string | null
    }>
    local_time: string | null
    website_url: string
    commit_email: string
    confirmed_at: string
    organization: string
    public_email: string | null
    projects_limit: number
    color_scheme_id: number
    last_sign_in_at: string
    private_profile: boolean
    scim_identities: any[]
    can_create_group: boolean
    last_activity_on: string
    work_information: string | null
    can_create_project: boolean
    current_sign_in_at: string
    two_factor_enabled: boolean
    shared_runners_minutes_limit: number | null
    extra_shared_runners_minutes_limit: number | null
  }
  groups: Array<{
    id: number
    name: string
    path: string
  }>
  userProjects: Array<{
    id: number
    name: string
    path_with_namespace: string
    enabled: boolean
  }>
  groupProjects: {
    [key: string]: Array<{
      groupId: number
      groupName: string
      groupPath: string
      id: number
      name: string
      path_with_namespace: string
      enabled: boolean
    }>
  }
  updateMemberAttributes: boolean
}
