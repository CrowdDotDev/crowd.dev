export interface IGetOrgRepositoriesResult {
  data: {
    id: number
    name: string
  }[]
  hasNextPage: boolean
  nextPage: number
  perPage: number
}

export interface IBasicResponse {
  actorLogin: string
  actorId: number
  actorAvatarUrl: string
  orgLogin: string | null
  orgId: number | null
  orgAvatarUrl: string | null
}

export interface IGetRepoStargazersResult extends IBasicResponse {
  id: number
  action: string
  timestamp: string
  payload: Record<string, unknown>
}

export interface IGetRepoForksResult extends IBasicResponse {
  id: number
  fork: string
  forkId: number
  timestamp: string
  payload: Record<string, unknown>
}

export interface IGetRepoPullRequestsResult extends IBasicResponse {
  id: number
  action: 'opened' | 'closed'
  pullRequestNumber: number
  timestamp: string
  payload: {
    action: 'opened' | 'closed'
    number: number
    pull_request: {
      _links: {
        comments: { href: string }
        commits: { href: string }
        html: { href: string }
        issue: { href: string }
        review_comment: { href: string }
        review_comments: { href: string }
        self: { href: string }
        statuses: { href: string }
      }
      active_lock_reason: string | null
      additions: number
      assignee: unknown | null
      assignees: unknown[]
      author_association: string
      auto_merge: unknown | null
      base: {
        label: string
        ref: string
        repo: {
          [key: string]: unknown
        }
        sha: string
        user: {
          [key: string]: unknown
        }
      }
      body: string
      changed_files: number
      closed_at: string | null
      comments: number
      comments_url: string
      commits: number
      commits_url: string
      created_at: string
      deletions: number
      diff_url: string
      draft: boolean
      head: {
        [key: string]: unknown
      }
      html_url: string
      id: number
      issue_url: string
      labels: unknown[]
      locked: boolean
      maintainer_can_modify: boolean
      merge_commit_sha: string | null
      mergeable: boolean | null
      mergeable_state: string
      merged: boolean
      merged_at: string | null
      merged_by: {
        [key: string]: unknown
      } | null
      milestone: unknown | null
      node_id: string
      number: number
      patch_url: string
      rebaseable: boolean | null
      requested_reviewers: unknown[]
      requested_teams: unknown[]
      review_comment_url: string
      review_comments: number
      review_comments_url: string
      state: string
      statuses_url: string
      title: string
      updated_at: string
      url: string
      user: {
        [key: string]: unknown
      }
    }
  }
}

export interface IGetRepoPullRequestReviewsResult extends IBasicResponse {
  id: number
  state: string
  pullRequestNumber: number
  timestamp: string
  payload: Record<string, unknown>
}

export interface IGetRepoPullRequestReviewCommentsResult extends IBasicResponse {
  id: number
  action: string
  pullRequestNumber: number
  timestamp: string
  payload: Record<string, unknown>
}

export interface IGetRepoPushesResult extends IBasicResponse {
  timestamp: string
  commitCount: number
  payload: Record<string, unknown>
}

export interface IGetRepoIssuesResult extends IBasicResponse {
  id: number
  action: string
  issueNumber: number
  timestamp: string
  payload: Record<string, unknown>
}

export interface IGetRepoIssueCommentsResult extends IBasicResponse {
  id: number
  action: string
  issueNumber: number
  timestamp: string
  payload: Record<string, unknown>
}

export interface IGetResponse<T extends IBasicResponse = IBasicResponse> {
  data: T[]
  hasNextPage: boolean
  nextPage: number
  perPage: number
}
