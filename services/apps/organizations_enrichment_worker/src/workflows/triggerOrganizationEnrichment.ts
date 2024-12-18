import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  proxyActivities,
  startChild,
} from '@temporalio/workflow'

import * as enrichmentActivities from '../activities/enrichment'
import { enrichOrganization } from '../workflows'

const aCtx = proxyActivities<typeof enrichmentActivities>({
  startToCloseTimeout: '75 seconds',
})

export async function triggerOrganizationsEnrichment(): Promise<void> {
  const perPage = 100
  let page = 1

  const max = await aCtx.getMaxEnrichedOrganizationsPerExecution()
  let remaining = max

  // get organizations to enrich
  let orgs = await aCtx.getOrganizationsToEnrich(perPage, page)

  while (orgs.length > 0) {
    for (const org of orgs) {
      if (remaining > 0) {
        remaining--

        // trigger organization enrichment
        await startChild(enrichOrganization, {
          workflowId: 'organization-enrichment/' + org.organizationId,
          cancellationType: ChildWorkflowCancellationType.ABANDON,
          parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
          workflowExecutionTimeout: '15 minutes',
          retry: {
            backoffCoefficient: 2,
            maximumAttempts: 10,
            initialInterval: 2 * 1000,
            maximumInterval: 30 * 1000,
          },
          args: [org],
        })
      } else {
        break
      }
    }

    if (remaining === 0) {
      break
    }

    orgs = await aCtx.getOrganizationsToEnrich(perPage, ++page)
  }
}
