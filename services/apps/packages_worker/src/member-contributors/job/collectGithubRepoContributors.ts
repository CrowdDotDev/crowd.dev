import { ApplicationFailure } from '@temporalio/activity'

import { getGithubAppConfig } from '../../config'
import { getPackagesDb } from '../../db'
import {
  RepoFetchOutcome,
  fetchGithubRepoOutcome,
  writeGithubRepoOutcomes,
} from '../github/syncGithubContributorsBatch'
import { readRunStart } from '../governance/syncGovernanceContributors'
import { JobRepo } from './start'

export interface CollectGithubRepoContributorsResult {
  status: 'fetched' | 'empty'
  logins: string[]
}

function assertCollectable(outcome: RepoFetchOutcome, repoUrl: string): 'fetched' | 'empty' {
  if (outcome.status === 'missing') {
    throw ApplicationFailure.nonRetryable('Repository not found on GitHub')
  }
  if (outcome.status === 'error') {
    throw new Error(`GitHub contributors fetch failed for ${repoUrl}`)
  }
  return outcome.status
}

export async function collectGithubRepoContributors(
  input: JobRepo,
): Promise<CollectGithubRepoContributorsResult> {
  getGithubAppConfig()
  const pkgsQx = await getPackagesDb()
  const observedAt = await readRunStart(pkgsQx)
  const outcome = await fetchGithubRepoOutcome({ id: input.repoId, url: input.repoUrl }, observedAt)
  const status = assertCollectable(outcome, input.repoUrl)
  await writeGithubRepoOutcomes(pkgsQx, [outcome], observedAt)
  return { status, logins: outcome.rows.map((row) => row.identityValue) }
}
