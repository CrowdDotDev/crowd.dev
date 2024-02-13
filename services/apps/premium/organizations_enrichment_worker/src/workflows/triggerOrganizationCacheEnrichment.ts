import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  proxyActivities,
  startChild,
} from '@temporalio/workflow'
import * as enrichmentActivities from '../activities/enrichment'
import { enrichOrganizationCache } from '../workflows'

const aCtx = proxyActivities<typeof enrichmentActivities>({
  startToCloseTimeout: '75 seconds',
})

export async function triggerOrganizationCacheEnrichment(): Promise<void> {
  const perPage = 100
  let page = 1

  const max = await aCtx.getMaxEnrichedOrganizationCachesPerExecution()
  let remaining = max

  // get organization caches to enrich
  let caches = await aCtx.getOrganizationCachesToEnrich(perPage, page)

  while (caches.length > 0) {
    for (const cache of caches) {
      if (remaining > 0) {
        remaining--

        // trigger organization cache enrichment
        await startChild(enrichOrganizationCache, {
          workflowId: 'organization-cache-enrichment/' + cache.id,
          cancellationType: ChildWorkflowCancellationType.ABANDON,
          parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
          workflowExecutionTimeout: '15 minutes',
          retry: {
            backoffCoefficient: 2,
            maximumAttempts: 10,
            initialInterval: 2 * 1000,
            maximumInterval: 30 * 1000,
          },
          args: [cache],
        })
      } else {
        break
      }
    }

    if (remaining === 0) {
      break
    }

    caches = await aCtx.getOrganizationCachesToEnrich(perPage, ++page)
  }
}
