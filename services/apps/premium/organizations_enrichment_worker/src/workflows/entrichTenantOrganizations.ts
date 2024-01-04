import { IPremiumTenantInfo } from '../repos/tenant.repo'
import * as activities from '../activities/organizationEnrichment'
import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  proxyActivities,
  startChild,
} from '@temporalio/workflow'
import { enrichOrganization } from './enrichOrganization'

const { getTenantCredits, getTenantOrganizationsForEnrichment } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '75 seconds',
})

const MAX_ENRICHED_ORGANIZATIONS_PER_EXECUTION = 500
const BATCH_SIZE = 10

export async function enrichTenantOrganizations(tenant: IPremiumTenantInfo): Promise<void> {
  // check how many credits the tenant has left
  // this will be our limit (1 credit = 1 enriched organization)
  const credits = await getTenantCredits(tenant)

  if (credits === 0) {
    // we have no credits left on this tenant
    return
  }

  let remainingCredits =
    credits === -1
      ? MAX_ENRICHED_ORGANIZATIONS_PER_EXECUTION
      : Math.min(credits, MAX_ENRICHED_ORGANIZATIONS_PER_EXECUTION)

  let lastId: string | undefined
  while (remainingCredits > 0) {
    const batchSize = Math.min(remainingCredits, BATCH_SIZE)
    // get organizations that should be enriched
    const organizationIds = await getTenantOrganizationsForEnrichment(tenant.id, batchSize, lastId)

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

    lastId = organizationIds[organizationIds.length - 1]
  }
}
