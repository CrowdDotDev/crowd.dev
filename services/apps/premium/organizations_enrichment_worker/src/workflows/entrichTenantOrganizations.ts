import { IPremiumTenantInfo } from '../repos/tenant.repo'
import * as activities from '../activities/organizationEnrichment'
import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  proxyActivities,
  startChild,
} from '@temporalio/workflow'
import { enrichOrganization } from './enrichOrganization'

const { getRemainingTenantCredits, getTenantOrganizationsForEnrichment } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '75 seconds',
})

const BATCH_SIZE = 100

export async function enrichTenantOrganizations(tenant: IPremiumTenantInfo): Promise<void> {
  // check how many credits the tenant has left
  // this will be our limit (1 credit = 1 enriched organization)
  let remainingCredits = await getRemainingTenantCredits(tenant)

  if (remainingCredits === 0) {
    // we have no credits left on this tenant
    return
  }

  let page = 1
  while (remainingCredits > 0) {
    const batchSize = Math.min(remainingCredits, BATCH_SIZE)
    // get organizations that should be enriched
    const organizationIds = await getTenantOrganizationsForEnrichment(tenant.id, batchSize, page)

    if (organizationIds.length === 0) {
      // no more organizations to enrich
      return
    }

    // trigger enrichment workflow
    const promises = []
    for (const organizationId of organizationIds) {
      promises.push(
        startChild(enrichOrganization, {
          workflowId: 'enrich-organization/' + organizationId,
          cancellationType: ChildWorkflowCancellationType.ABANDON,
          parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
          workflowExecutionTimeout: '15 minutes',
          retry: {
            backoffCoefficient: 2,
            maximumAttempts: 10,
            initialInterval: 2 * 1000,
            maximumInterval: 30 * 1000,
          },
          args: [
            {
              organizationId,
              tenantId: tenant.id,
              plan: tenant.plan,
            },
          ],
          searchAttributes: {
            TenantId: [tenant.id],
          },
        }),
      )
      remainingCredits--
    }

    await Promise.all(promises)

    page++
  }
}
