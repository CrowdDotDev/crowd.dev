/* eslint-disable @typescript-eslint/no-explicit-any */
import { PlatformType } from '@crowd/types'

export enum NangoIntegration {
  GERRIT = 'gerrit',
  JIRA_CLOUD_BASIC = 'jira-basic',
  JIRA_DATA_CENTER_API_KEY = 'jira-data-center-api-key',
  JIRA_DATA_CENTER_BASIC = 'jira-data-center-basic',
  GITHUB = 'github',
}

export const ALL_NANGO_INTEGRATIONS = Object.values(NangoIntegration)

export const nangoIntegrationToPlatform = (integration: NangoIntegration): PlatformType => {
  switch (integration) {
    case NangoIntegration.GERRIT:
      return PlatformType.GERRIT
    case NangoIntegration.GITHUB:
      return PlatformType.GITHUB_NANGO
    default:
      throw new Error('Unknown integration')
  }
}

export const platformToNangoIntegration = (platform: PlatformType): NangoIntegration => {
  switch (platform) {
    case PlatformType.GERRIT:
      return NangoIntegration.GERRIT
    case PlatformType.GITHUB_NANGO:
      return NangoIntegration.GITHUB
    default:
      throw new Error('Unknown platform')
  }
}

export const NANGO_INTEGRATION_CONFIG = {
  [NangoIntegration.GERRIT]: {
    models: {
      CHANGESET: 'Changeset',
      CHANGESET_COMMENT: 'ChangeComment',
      PATCHSET: 'Patchset',
    },
    syncs: {
      CHANGESETS: 'changesets',
      CHANGESET_COMMENTS: 'changeset-comments',
      PATCHSETS: 'patchsets',
    },
  },
  [NangoIntegration.GITHUB]: {
    models: {
      DISCUSSION: 'GithubDiscussion',
      FORK: 'GithubFork',
      ISSUE_COMMENT: 'GithubIssueComment',
      ISSUE: 'GithubIssue',
      PULL_REQUEST_COMMENT: 'GithubPullRequestComment',
      PULL_REQUEST_REVIEW_THREAD_COMMENT: 'GithubPullRequestReviewThreadComment',
      PULL_REQUEST_COMMIT: 'GithubPullRequestCommit',
      PULL_REQUEST: 'GithubPullRequest',
      STAR: 'GithubStar',
    },
    syncs: {
      DISCUSSIONS: 'discussions',
      FORKS: 'forks',
      ISSUES: 'issues',
      ISSUE_COMMENTS: 'issue-comments',
      PULL_REQUESTS: 'pull-requests',
      PULL_REQUEST_COMMENTS: 'pull-request-comments',
      PULL_REQUEST_REVIEWS: 'pull-request-reviews',
      PULL_REQUEST_COMMITS: 'pull-request-commits',
      STARS: 'stars',
    },
  },
  [NangoIntegration.JIRA_CLOUD_BASIC]: {
    models: {
      ISSUES: 'Issue',
      ISSUE_COMMENT: 'IssueComment',
      ISSUE_ATTACHMENTS: 'IssueAttachment',
    },
    syncs: {
      ISSUES: 'issues',
      ISSUE_COMMENT: 'issue-comments',
      ISSUE_ATTACHMENTS: 'issue-attachments',
    },
  },
  [NangoIntegration.JIRA_DATA_CENTER_BASIC]: {
    models: {
      ISSUES: 'Issue',
      ISSUE_COMMENT: 'IssueComment',
      ISSUE_ATTACHMENTS: 'IssueAttachment',
    },
    syncs: {
      ISSUES: 'issues',
      ISSUE_COMMENT: 'issue-comments',
      ISSUE_ATTACHMENTS: 'issue-attachments',
    },
  },
  [NangoIntegration.JIRA_DATA_CENTER_API_KEY]: {
    models: {
      ISSUES: 'Issue',
      ISSUE_COMMENT: 'IssueComment',
      ISSUE_ATTACHMENTS: 'IssueAttachment',
    },
    syncs: {
      ISSUES: 'issues',
      ISSUE_COMMENT: 'issue-comments',
      ISSUE_ATTACHMENTS: 'issue-attachments',
    },
  },
} as const satisfies IntegrationConfig

export type IntegrationConfig = {
  [K in NangoIntegration]: {
    models: Record<string, string>
    syncs: Record<string, string>
  }
}

export interface INangoCloudSessionToken {
  token: string
  expiresAt: string
}

export enum NangoMetadataLastAction {
  ADDED = 'ADDED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
}

export interface INangoRecord {
  id?: string
  timestamp: number
  integrationId: string

  activity: any

  metadata: INangoRecordMetadata

  rawPayload: unknown
}

export interface INangoRecordMetadata {
  deletedAt: string | null
  lastAction: NangoMetadataLastAction
  firstSeenAt: string
  cursor: string
  lastModifiedAt: string
}

export interface INangoResult {
  records: INangoRecord[]
  nextCursor?: string
}

export interface INangoClientConfig {
  secretKey: string
  integrations: string[]
}

export interface INangoWebhookPayload {
  connectionId: string
  providerConfigKey: string
  syncName: string
  model: string
  responseResults: { added: number; updated: number; deleted: number }
  syncType: 'INITIAL' | 'INCREMENTAL'
  modifiedAfter: string
}
