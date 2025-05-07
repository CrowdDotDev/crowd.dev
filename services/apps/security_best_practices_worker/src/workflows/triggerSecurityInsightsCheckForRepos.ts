import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  continueAsNew,
  executeChild,
  proxyActivities,
  workflowInfo,
} from '@temporalio/workflow'

import * as activities from '../activities'
import { ITriggerSecurityInsightsCheckForReposParams } from '../types'

import { upsertOSPSBaselineSecurityInsights } from './upsertOSPSBaselineSecurityInsights'

const { findObsoleteRepos } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function triggerSecurityInsightsCheckForRepos(
  args: ITriggerSecurityInsightsCheckForReposParams,
): Promise<void> {
  const info = workflowInfo()

  const failedRepoUrls = args?.failedRepoUrls || []

  const REPOS_OBSOLETE_AFTER_SECONDS = 30 * 24 * 60 * 60 // 30 days
  const LIMIT_REPOS_TO_CHECK_PER_RUN = 1000
  const MAX_PARALLEL_CHILDREN = 3

  const repos = await findObsoleteRepos(
    REPOS_OBSOLETE_AFTER_SECONDS,
    failedRepoUrls,
    LIMIT_REPOS_TO_CHECK_PER_RUN,
  )

  if (repos.length === 0) {
    return
  }

  for (let i = 0; i < repos.length; i += MAX_PARALLEL_CHILDREN) {
    const batch = repos.slice(i, i + MAX_PARALLEL_CHILDREN)

    const tasks = batch.map((repo) =>
      executeChild(upsertOSPSBaselineSecurityInsights, {
        workflowId: `${info.workflowId}->${repo.repoUrl}`,
        cancellationType: ChildWorkflowCancellationType.ABANDON,
        parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
        retry: {
          maximumAttempts: 2,
          backoffCoefficient: 3,
          initialInterval: 2 * 1000,
          maximumInterval: 30 * 1000,
        },
        args: [
          {
            repoUrl: repo.repoUrl,
            insightsProjectId: repo.insightsProjectId,
            insightsProjectSlug: repo.insightsProjectSlug,
          },
        ],
        searchAttributes: {},
      }).catch((error) => {
        console.error(`Failed to process repo ${repo.repoUrl}:`, error)
        failedRepoUrls.push(repo.repoUrl)
      }),
    )

    await Promise.all(tasks)
  }

  await continueAsNew<typeof triggerSecurityInsightsCheckForRepos>({
    failedRepoUrls,
  })
}
