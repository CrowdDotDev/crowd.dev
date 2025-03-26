/* eslint-disable @typescript-eslint/no-explicit-any */

export enum NangoIntegration {
  GERRIT = 'gerrit',
  // JIRA = 'jira',
  GITHUB = 'github',
}

export const ALL_NANGO_INTEGRATIONS = Object.values(NangoIntegration)

export const nangoIntegrationToPlatform = (integration: NangoIntegration): string => {
  switch (integration) {
    case NangoIntegration.GERRIT:
      return 'gerrit'
    case NangoIntegration.GITHUB:
      return 'github-nango'
    default:
      throw new Error('Unknown integration')
  }
}

export const platformToNangoIntegration = (platform: string): NangoIntegration => {
  switch (platform) {
    case 'gerrit':
      return NangoIntegration.GERRIT
    case 'github-nango':
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
      COMMIT: 'GithubCommit',
      DISCUSSION: 'GithubDiscussion',
      FORK: 'GithubFork',
      ISSUE_COMMENT: 'GithubIssueComment',
      ISSUE: 'GithubIssue',
      PULL_REQUEST_COMMENT: 'GithubPullRequestComment',
      PULL_REQUEST_REVIEW_THREAD_COMMENT: 'GithubPullRequestReviewThreadComment',
      PULL_REQUEST: 'GithubPullRequest',
      STAR: 'GithubStar',
    },
    syncs: {
      COMMITS: 'commits',
      DISCUSSIONS: 'discussions',
      FORKS: 'forks',
      ISSUES: 'issues',
      PULL_REQUESTS: 'pull-requests',
      STARS: 'stars',
    },
  },
  // [NangoIntegration.JIRA]: {
  //   models: {},
  //   syncs: {},
  // },
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
