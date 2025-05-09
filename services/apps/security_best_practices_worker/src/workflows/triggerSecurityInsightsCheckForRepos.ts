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

const { findObsoleteRepos, getNextToken, initializeTokenInfos, acquireToken, releaseToken } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '5 minutes',
    retry: { maximumAttempts: 3, backoffCoefficient: 3 },
  })

export async function triggerSecurityInsightsCheckForRepos(
  args: ITriggerSecurityInsightsCheckForReposParams,
): Promise<void> {
  const info = workflowInfo()
  const failedRepoUrls = args?.failedRepoUrls || []

  const REPOS_OBSOLETE_AFTER_SECONDS = 30 * 24 * 60 * 60 // 30 days
  const LIMIT_REPOS_TO_CHECK_PER_RUN = 1000
  const MAX_PARALLEL_CHILDREN = 5
  const MAX_TOKEN_ATTEMPTS = 5

  const tokenInfos: ITokenInfo[] = await initializeTokenInfos()
  const repos = await findObsoleteRepos(
    REPOS_OBSOLETE_AFTER_SECONDS,
    failedRepoUrls,
    LIMIT_REPOS_TO_CHECK_PER_RUN,
  )

  if (repos.length === 0) {
    return
  }

  const queue = [...repos]
  const activeTasks: Promise<void>[] = []

  async function processRepo(repo: (typeof repos)[0]): Promise<void> {
    let attempts = 0
    while (attempts < MAX_TOKEN_ATTEMPTS) {
      const tokenInfo = await getNextToken(tokenInfos)
      const token = tokenInfo.token

      await acquireToken(tokenInfos, tokenInfo.token)

      try {
        await executeChild(upsertOSPSBaselineSecurityInsights, {
          workflowId: `${info.workflowId}->${repo.repoUrl}->attempt${attempts}`,
          cancellationType: ChildWorkflowCancellationType.ABANDON,
          parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
          retry: {
            maximumAttempts: 3,
            initialInterval: 2000,
            backoffCoefficient: 2,
            maximumInterval: 30000,
            nonRetryableErrorTypes: ['Token403Error'],
          },
          args: [
            {
              repoUrl: repo.repoUrl,
              insightsProjectId: repo.insightsProjectId,
              insightsProjectSlug: repo.insightsProjectSlug,
              token,
            },
          ],
        })
        return // Success
      } catch (error: any) {
        if (error instanceof ApplicationFailure && error.type === 'Token403Error') {
          tokenInfo.isRateLimited = true
          attempts++
          continue // Retry with a different token
        } else {
          console.error(`Failed to process repo ${repo.repoUrl}:`, error)
          failedRepoUrls.push(repo.repoUrl)
          break // Non-retryable error
        }
      } finally {
        await releaseToken(tokenInfos, tokenInfo.token)
      }
    }
  }

  while (queue.length > 0 || activeTasks.length > 0) {
    // Fill up available slots
    while (queue.length > 0 && activeTasks.length < MAX_PARALLEL_CHILDREN) {
      const repo = queue.shift()
      const task = processRepo(repo).finally(() => {
        // Remove finished task
        const index = activeTasks.indexOf(task)
        if (index >= 0) activeTasks.splice(index, 1)
      })
      activeTasks.push(task)
    }

    // Wait for any one to finish before refilling
    if (activeTasks.length > 0) {
      await Promise.race(activeTasks)
    }
  }

  await continueAsNew<typeof triggerSecurityInsightsCheckForRepos>({
    failedRepoUrls,
  })
}
