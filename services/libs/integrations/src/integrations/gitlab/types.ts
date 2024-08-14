import {
  ProjectSchema,
  UserSchema,
  ProjectStarrerSchema,
  CommitSchema,
  IssueSchema,
  MergeRequestSchema,
} from '@gitbeaker/rest'

export enum GitlabActivityType {
  ISSUE = 'issue',
  MERGE_REQUEST = 'merge_request',
  COMMIT = 'commit',
  DISCUSSION = 'discussion',
  STAR = 'star',
  FORK = 'fork',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GitlabActivityData<T = any> {
  data: T
  user: UserSchema
}

export type GitlabForkData = GitlabActivityData<ProjectSchema>
export type GitlabStarData = GitlabActivityData<ProjectStarrerSchema>
export type GitlabCommitData = GitlabActivityData<CommitSchema>
export type GitlabIssueData = GitlabActivityData<IssueSchema>
export type GitlabMergeRequestData = GitlabActivityData<MergeRequestSchema>

export interface GitlabApiResult<T> {
  data: T
  nextPage: number | null
}

export interface GitlabApiData<T> {
  type: GitlabActivityType
  data: GitlabActivityData<T>
  projectId: string
}

export enum GitlabStreamType {
  ROOT = 'root',
  ISSUES = 'issues',
  MERGE_REQUESTS = 'merge_requests',
  COMMITS = 'commits',
  DISCUSSIONS = 'discussions',
  STARS = 'stars',
  FORKS = 'forks',
}

export interface GitlabRootStream {
  projectIds: string[]
}

export interface GitlabBasicStream {
  projectId: string
  page: number
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
  }>
  groupProjects: {
    [key: string]: Array<{
      groupId: number
      groupName: string
      groupPath: string
      id: number
      name: string
      path_with_namespace: string
    }>
  }
  updateMemberAttributes: boolean
}
