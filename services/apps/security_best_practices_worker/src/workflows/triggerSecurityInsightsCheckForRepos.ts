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
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function triggerSecurityInsightsCheckForRepos(
  args: ITriggerSecurityInsightsCheckForReposParams,
): Promise<void> {
  const info = workflowInfo()

  const failedRepos = args?.failedRepos || []

  const REPOS_OBSOLETE_AFTER_SECONDS = 30 * 24 * 60 * 60 // 30 days
  const LIMIT_REPOS_TO_CHECK_PER_RUN = 1000

  // We won't try same repos again if they already failed(and retried) in the same-day run
  const repos = await findObsoleteRepos(
    REPOS_OBSOLETE_AFTER_SECONDS,
    failedRepos,
    LIMIT_REPOS_TO_CHECK_PER_RUN,
  )

  if (repos.length === 0) {
    return
  }

  for (const repo of repos) {
    try {
      await executeChild(upsertOSPSBaselineSecurityInsights, {
        workflowId: `${info.workflowId}->${repo}`,
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
            repoUrl: repo,
          },
        ],
        searchAttributes: {},
      })
    } catch (error) {
      console.error(`Failed to process repo ${repo}:`, error)
      failedRepos.push(repo)
    }
  }

  await continueAsNew<typeof triggerSecurityInsightsCheckForRepos>({
    failedRepos,
  })
}
