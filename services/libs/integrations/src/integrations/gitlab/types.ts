/* eslint-disable @typescript-eslint/no-explicit-any */

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

export enum GitlabWebhookType {
  ISSUE = 'issue',
  ISSUE_COMMENT = 'issue_comment',
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
  type: GitlabActivityType | GitlabWebhookType
  data: GitlabActivityData<T>
  projectId: string
  pathWithNamespace: string
  isWebhook?: boolean
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
interface GitlabWebhookBase {
  object_kind: string
  event_type: string
  user: {
    id: number
    name: string
    username: string
    avatar_url: string
    email: string
  }
  project: {
    id: number
    name: string
    description: string
    web_url: string
    avatar_url: string | null
    git_ssh_url: string
    git_http_url: string
    namespace: string
    visibility_level: number
    path_with_namespace: string
    default_branch: string
    ci_config_path: string
    homepage: string
    url: string
    ssh_url: string
    http_url: string
  }
  repository: {
    name: string
    url: string
    description: string
    homepage: string
  }
}

export interface GitlabIssueWebhook extends GitlabWebhookBase {
  object_kind: 'issue'
  object_attributes: {
    author_id: number
    closed_at: string | null
    confidential: boolean
    created_at: string
    description: string
    discussion_locked: boolean | null
    due_date: string | null
    id: number
    iid: number
    last_edited_at: string | null
    last_edited_by_id: number | null
    milestone_id: number | null
    moved_to_id: number | null
    duplicated_to_id: number | null
    project_id: number
    relative_position: number | null
    state_id: number
    time_estimate: number
    title: string
    updated_at: string
    updated_by_id: number | null
    weight: number | null
    health_status: string | null
    type: string
    url: string
    total_time_spent: number
    time_change: number
    human_total_time_spent: string | null
    human_time_change: string | null
    human_time_estimate: string | null
    assignee_ids: number[]
    assignee_id: number | null
    labels: string[]
    state: string
    severity: string
    customer_relations_contacts: any[]
    action: string
  }
  labels: string[]
  changes: {
    [key: string]: {
      previous: any
      current: any
    }
  }
}

export interface GitlabIssueCommentWebhook extends GitlabWebhookBase {
  object_kind: 'note'
  object_attributes: {
    attachment: null
    author_id: number
    change_position: null
    commit_id: null
    created_at: string
    discussion_id: string
    id: number
    line_code: null
    note: string
    noteable_id: number
    noteable_type: string
    original_position: null
    position: null
    project_id: number
    resolved_at: null
    resolved_by_id: null
    resolved_by_push: null
    st_diff: null
    system: boolean
    type: null
    updated_at: string
    updated_by_id: null
    description: string
    url: string
    action: string
  }
  issue: {
    author_id: number
    closed_at: string | null
    confidential: boolean
    created_at: string
    description: string
    discussion_locked: boolean | null
    due_date: string | null
    id: number
    iid: number
    last_edited_at: string | null
    last_edited_by_id: number | null
    milestone_id: number | null
    moved_to_id: number | null
    duplicated_to_id: number | null
    project_id: number
    relative_position: number
    state_id: number
    time_estimate: number
    title: string
    updated_at: string
    updated_by_id: number | null
    weight: number | null
    health_status: string | null
    type: string
    url: string
    total_time_spent: number
    time_change: number
    human_total_time_spent: string | null
    human_time_change: string | null
    human_time_estimate: string | null
    assignee_ids: number[]
    assignee_id: number | null
    labels: string[]
    state: string
    severity: string
    customer_relations_contacts: any[]
  }
}

export interface GitlabWebhook {
  data: GitlabIssueWebhook | GitlabIssueCommentWebhook
  date: string
  headers: Record<string, string>
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
