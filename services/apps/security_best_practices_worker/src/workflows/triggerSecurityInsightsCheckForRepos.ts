import {
  ApplicationFailure,
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  continueAsNew,
  executeChild,
  proxyActivities,
  workflowInfo,
} from '@temporalio/workflow'

import * as activities from '../activities'
import { ITokenInfo, ITriggerSecurityInsightsCheckForReposParams } from '../types'

import { upsertOSPSBaselineSecurityInsights } from './upsertOSPSBaselineSecurityInsights'

const { findObsoleteRepos, getNextToken } = proxyActivities<typeof activities>({
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
  const MAX_TOKEN_ATTEMPTS = 5

  const tokenInfos: ITokenInfo[] = process.env['CROWD_GITHUB_PERSONAL_ACCESS_TOKENS']
    .split(',')
    .map((token) => ({
      token,
      inUse: false,
      lastUsed: new Date(),
      isRateLimited: false,
    }))

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

    const tasks = batch.map(async (repo) => {
      let attempts = 0
      while (attempts < MAX_TOKEN_ATTEMPTS) {
        const token = (await getNextToken(tokenInfos)).token

        try {
          await executeChild(upsertOSPSBaselineSecurityInsights, {
            workflowId: `${info.workflowId}->${repo.repoUrl}->attempt${attempts}`,
            cancellationType: ChildWorkflowCancellationType.ABANDON,
            parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
            retry: {
              maximumAttempts: 3, // built-in retries for transient errors
              initialInterval: 2000,
              backoffCoefficient: 2,
              maximumInterval: 30000,
              nonRetryableErrorTypes: ['Token403Error'], // manual retry for 403
            },
            args: [
              {
                repoUrl: repo.repoUrl,
                insightsProjectId: repo.insightsProjectId,
                insightsProjectSlug: repo.insightsProjectSlug,
                token,
              },
            ],
            searchAttributes: {},
          })
          return // success, exit retry loop
        } catch (error: any) {
          if (error instanceof ApplicationFailure && error.type === 'Token403Error') {
            const tokenInfo = tokenInfos.find((t) => t.token === token)
            if (tokenInfo) tokenInfo.isRateLimited = true

            attempts++
            continue // retry with new token
          } else {
            // For all other errors, let them bubble up if not retried by Temporal
            console.error(`Failed to process repo ${repo.repoUrl}:`, error)
            failedRepoUrls.push(repo.repoUrl)
            break
          }
        }
      }
    })

    await Promise.all(tasks)
  }

  await continueAsNew<typeof triggerSecurityInsightsCheckForRepos>({
    failedRepoUrls,
  })
}
