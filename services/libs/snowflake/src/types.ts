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
  payload: {
    action: string
    comment: {
      _links: {
        html: {
          href: string
        }
        pull_request: {
          href: string
        }
        self: {
          href: string
        }
      }
      author_association: string
      body: string
      commit_id: string
      created_at: string
      diff_hunk: string
      html_url: string
      id: number
      line: number
      node_id: string
      original_commit_id: string
      original_line: number
      original_position: number
      original_start_line: number
      path: string
      position: number
      pull_request_review_id: number
      pull_request_url: string
      reactions: {
        '+1': number
        '-1': number
        confused: number
        eyes: number
        heart: number
        hooray: number
        laugh: number
        rocket: number
        total_count: number
        url: string
      }
      side: string
      start_line: number
      start_side: string
      subject_type: string
      updated_at: string
      url: string
      user: {
        avatar_url: string
        events_url: string
        followers_url: string
        following_url: string
        gists_url: string
        gravatar_id: string
        html_url: string
        id: number
        login: string
        node_id: string
        organizations_url: string
        received_events_url: string
        repos_url: string
        site_admin: boolean
        starred_url: string
        subscriptions_url: string
        type: string
        url: string
        user_view_type: string
      }
    }
    pull_request: {
      _links: {
        comments: {
          href: string
        }
        commits: {
          href: string
        }
        html: {
          href: string
        }
        issue: {
          href: string
        }
        review_comment: {
          href: string
        }
        review_comments: {
          href: string
        }
        self: {
          href: string
        }
        statuses: {
          href: string
        }
      }
      active_lock_reason: string | null
      assignee: {
        avatar_url: string
        events_url: string
        followers_url: string
        following_url: string
        gists_url: string
        gravatar_id: string
        html_url: string
        id: number
        login: string
        node_id: string
        organizations_url: string
        received_events_url: string
        repos_url: string
        site_admin: boolean
        starred_url: string
        subscriptions_url: string
        type: string
        url: string
        user_view_type: string
      }
      assignees: Array<{
        avatar_url: string
        events_url: string
        followers_url: string
        following_url: string
        gists_url: string
        gravatar_id: string
        html_url: string
        id: number
        login: string
        node_id: string
        organizations_url: string
        received_events_url: string
        repos_url: string
        site_admin: boolean
        starred_url: string
        subscriptions_url: string
        type: string
        url: string
        user_view_type: string
      }>
      author_association: string
      auto_merge: null
      base: {
        label: string
        ref: string
        repo: {
          allow_forking: boolean
          archive_url: string
          archived: boolean
          assignees_url: string
          blobs_url: string
          branches_url: string
          clone_url: string
          collaborators_url: string
          comments_url: string
          commits_url: string
          compare_url: string
          contents_url: string
          contributors_url: string
          created_at: string
          default_branch: string
          deployments_url: string
          description: string
          disabled: boolean
          downloads_url: string
          events_url: string
          fork: boolean
          forks: number
          forks_count: number
          forks_url: string
          full_name: string
          git_commits_url: string
          git_refs_url: string
          git_tags_url: string
          git_url: string
          has_discussions: boolean
          has_downloads: boolean
          has_issues: boolean
          has_pages: boolean
          has_projects: boolean
          has_wiki: boolean
          homepage: string
          hooks_url: string
          html_url: string
          id: number
          is_template: boolean
          issue_comment_url: string
          issue_events_url: string
          issues_url: string
          keys_url: string
          labels_url: string
          language: string
          languages_url: string
          license: {
            key: string
            name: string
            node_id: string
            spdx_id: string
            url: string
          }
          merges_url: string
          milestones_url: string
          mirror_url: string | null
          name: string
          node_id: string
          notifications_url: string
          open_issues: number
          open_issues_count: number
          owner: {
            avatar_url: string
            events_url: string
            followers_url: string
            following_url: string
            gists_url: string
            gravatar_id: string
            html_url: string
            id: number
            login: string
            node_id: string
            organizations_url: string
            received_events_url: string
            repos_url: string
            site_admin: boolean
            starred_url: string
            subscriptions_url: string
            type: string
            url: string
            user_view_type: string
          }
          private: boolean
          pulls_url: string
          pushed_at: string
          releases_url: string
          size: number
          ssh_url: string
          stargazers_count: number
          stargazers_url: string
          statuses_url: string
          subscribers_url: string
          subscription_url: string
          svn_url: string
          tags_url: string
          teams_url: string
          topics: string[]
          trees_url: string
          updated_at: string
          url: string
          visibility: string
          watchers: number
          watchers_count: number
          web_commit_signoff_required: boolean
        }
        sha: string
        user: {
          avatar_url: string
          events_url: string
          followers_url: string
          following_url: string
          gists_url: string
          gravatar_id: string
          html_url: string
          id: number
          login: string
          node_id: string
          organizations_url: string
          received_events_url: string
          repos_url: string
          site_admin: boolean
          starred_url: string
          subscriptions_url: string
          type: string
          url: string
          user_view_type: string
        }
      }
      body: string
      closed_at: string | null
      comments_url: string
      commits_url: string
      created_at: string
      diff_url: string
      draft: boolean
      head: {
        label: string
        ref: string
        repo: {
          allow_forking: boolean
          archive_url: string
          archived: boolean
          assignees_url: string
          blobs_url: string
          branches_url: string
          clone_url: string
          collaborators_url: string
          comments_url: string
          commits_url: string
          compare_url: string
          contents_url: string
          contributors_url: string
          created_at: string
          default_branch: string
          deployments_url: string
          description: string
          disabled: boolean
          downloads_url: string
          events_url: string
          fork: boolean
          forks: number
          forks_count: number
          forks_url: string
          full_name: string
          git_commits_url: string
          git_refs_url: string
          git_tags_url: string
          git_url: string
          has_discussions: boolean
          has_downloads: boolean
          has_issues: boolean
          has_pages: boolean
          has_projects: boolean
          has_wiki: boolean
          homepage: string
          hooks_url: string
          html_url: string
          id: number
          is_template: boolean
          issue_comment_url: string
          issue_events_url: string
          issues_url: string
          keys_url: string
          labels_url: string
          language: string
          languages_url: string
          license: {
            key: string
            name: string
            node_id: string
            spdx_id: string
            url: string
          }
          merges_url: string
          milestones_url: string
          mirror_url: string | null
          name: string
          node_id: string
          notifications_url: string
          open_issues: number
          open_issues_count: number
          owner: {
            avatar_url: string
            events_url: string
            followers_url: string
            following_url: string
            gists_url: string
            gravatar_id: string
            html_url: string
            id: number
            login: string
            node_id: string
            organizations_url: string
            received_events_url: string
            repos_url: string
            site_admin: boolean
            starred_url: string
            subscriptions_url: string
            type: string
            url: string
            user_view_type: string
          }
          private: boolean
          pulls_url: string
          pushed_at: string
          releases_url: string
          size: number
          ssh_url: string
          stargazers_count: number
          stargazers_url: string
          statuses_url: string
          subscribers_url: string
          subscription_url: string
          svn_url: string
          tags_url: string
          teams_url: string
          topics: string[]
          trees_url: string
          updated_at: string
          url: string
          visibility: string
          watchers: number
          watchers_count: number
          web_commit_signoff_required: boolean
        }
        sha: string
        user: {
          avatar_url: string
          events_url: string
          followers_url: string
          following_url: string
          gists_url: string
          gravatar_id: string
          html_url: string
          id: number
          login: string
          node_id: string
          organizations_url: string
          received_events_url: string
          repos_url: string
          site_admin: boolean
          starred_url: string
          subscriptions_url: string
          type: string
          url: string
          user_view_type: string
        }
      }
      html_url: string
      id: number
      issue_url: string
      labels: Array<{
        color: string
        default: boolean
        description: string
        id: number
        name: string
        node_id: string
        url: string
      }>
      locked: boolean
      merge_commit_sha: string
      merged_at: string | null
      milestone: null
      node_id: string
      number: number
      patch_url: string
      requested_reviewers: Array<{
        avatar_url: string
        events_url: string
        followers_url: string
        following_url: string
        gists_url: string
        gravatar_id: string
        html_url: string
        id: number
        login: string
        node_id: string
        organizations_url: string
        received_events_url: string
        repos_url: string
        site_admin: boolean
        starred_url: string
        subscriptions_url: string
        type: string
        url: string
        user_view_type: string
      }>
      requested_teams: unknown[]
      review_comment_url: string
      review_comments_url: string
      state: string
      statuses_url: string
      title: string
      updated_at: string
      url: string
      user: {
        avatar_url: string
        events_url: string
        followers_url: string
        following_url: string
        gists_url: string
        gravatar_id: string
        html_url: string
        id: number
        login: string
        node_id: string
        organizations_url: string
        received_events_url: string
        repos_url: string
        site_admin: boolean
        starred_url: string
        subscriptions_url: string
        type: string
        url: string
        user_view_type: string
      }
    }
  }
}

export interface IGetRepoPushesResult extends IBasicResponse {
  timestamp: string
  commitCount: number
  payload: Record<string, unknown>
}

export interface IGetRepoIssuesResult extends IBasicResponse {
  id: number
  action: 'opened' | 'closed' | 'reopened'
  issueNumber: number
  timestamp: string
  payload: {
    action: 'opened' | 'closed' | 'reopened'
    issue: {
      active_lock_reason: string | null
      assignee: unknown | null
      assignees: unknown[]
      author_association: string
      body: string | null
      closed_at: string | null
      comments: number
      comments_url: string
      created_at: string
      events_url: string
      html_url: string
      id: number
      labels: unknown[]
      labels_url: string
      locked: boolean
      milestone: unknown | null
      node_id: string
      number: number
      performed_via_github_app: unknown | null
      reactions: {
        '+1': number
        '-1': number
        confused: number
        eyes: number
        heart: number
        hooray: number
        laugh: number
        rocket: number
        total_count: number
        url: string
      }
      repository_url: string
      state: string
      state_reason: string | null
      timeline_url: string
      title: string
      updated_at: string
      url: string
      user: {
        avatar_url: string
        events_url: string
        followers_url: string
        following_url: string
        gists_url: string
        gravatar_id: string
        html_url: string
        id: number
        login: string
        node_id: string
        organizations_url: string
        received_events_url: string
        repos_url: string
        site_admin: boolean
        starred_url: string
        subscriptions_url: string
        type: string
        url: string
      }
    }
  }
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
