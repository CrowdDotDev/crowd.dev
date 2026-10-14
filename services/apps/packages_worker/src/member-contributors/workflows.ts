import { continueAsNew, proxyActivities, workflowInfo } from '@temporalio/workflow'

import type * as memberContributorActivities from './activities'
import type {
  GitActivitySyncCounts,
  GitActivitySyncOptions,
} from './git-activity/syncGitActivityContributors'
import { type GithubSyncCounts, addGithubSyncCounts, emptyGithubSyncCounts } from './github/counts'
import type { GovernanceSyncCounts } from './governance/syncGovernanceContributors'

const RETRY = {
  initialInterval: '30 seconds',
  backoffCoefficient: 2,
  maximumAttempts: 3,
}

const { syncGovernanceContributors } = proxyActivities<typeof memberContributorActivities>({
  startToCloseTimeout: '1 hour',
  heartbeatTimeout: '5 minutes',
  retry: RETRY,
})

const { syncGitActivityContributors } = proxyActivities<typeof memberContributorActivities>({
  startToCloseTimeout: '4 hours',
  heartbeatTimeout: '10 minutes',
  retry: RETRY,
})

const { syncGithubContributorsBatch } = proxyActivities<typeof memberContributorActivities>({
  startToCloseTimeout: '2 hours',
  heartbeatTimeout: '5 minutes',
  retry: RETRY,
})

const GITHUB_BATCH_SIZE = 500
const GITHUB_BATCHES_PER_RUN = 20

export interface GithubSyncState {
  runStartedAt: string
  counts: GithubSyncCounts
}

export async function syncGovernanceFileContributors(): Promise<GovernanceSyncCounts> {
  return syncGovernanceContributors()
}

export async function syncRepoContributorsFromGitActivity(
  options: GitActivitySyncOptions,
): Promise<GitActivitySyncCounts> {
  return syncGitActivityContributors(options)
}

export async function syncRepoContributorsFromGithub(
  state: GithubSyncState = {
    runStartedAt: workflowInfo().startTime.toISOString(),
    counts: emptyGithubSyncCounts(),
  },
): Promise<GithubSyncCounts> {
  let counts = state.counts

  for (let batch = 0; batch < GITHUB_BATCHES_PER_RUN; batch++) {
    const result = await syncGithubContributorsBatch({
      runStartedAt: state.runStartedAt,
      limit: GITHUB_BATCH_SIZE,
    })
    counts = addGithubSyncCounts(counts, result.counts)
    if (result.counts.selected < GITHUB_BATCH_SIZE) return counts
  }

  return continueAsNew<typeof syncRepoContributorsFromGithub>({
    runStartedAt: state.runStartedAt,
    counts,
  })
}
