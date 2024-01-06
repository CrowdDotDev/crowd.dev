import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  proxyActivities,
  startChild,
} from '@temporalio/workflow'
import * as activities from '../activities/organizationEnrichment'
import { enrichTenantOrganizations } from './entrichTenantOrganizations'

const { getApplicableTenants, hasTenantOrganizationEnrichmentEnabled } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '75 seconds',
})

export async function triggerTenantOrganizationEnrichment(): Promise<void> {
  const perPage = 100
  // get tenants that are applicable for organization enrichment
  let tenants = await getApplicableTenants(perPage)
  while (tenants.length > 0) {
    const tenantsEnabled = await Promise.all(
      tenants.map((t) => hasTenantOrganizationEnrichmentEnabled(t.id)),
    )
    const enabledTenants = tenants.filter((_, i) => tenantsEnabled[i])
    if (enabledTenants.length > 0) {
      // trigger tenant organization enrichment for each tenant
      await Promise.all(
        enabledTenants.map((tenant) => {
          return startChild(enrichTenantOrganizations, {
            workflowId: 'tenant-organizations-enrichment/' + tenant.id,
            cancellationType: ChildWorkflowCancellationType.ABANDON,
            parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
            workflowExecutionTimeout: '15 minutes',
            retry: {
              backoffCoefficient: 2,
              maximumAttempts: 10,
              initialInterval: 2 * 1000,
              maximumInterval: 30 * 1000,
            },
            args: [tenant],
            searchAttributes: {
              TenantId: [tenant.id],
            },
          })
        }),
      )
    }

    // load next page of applicable tenants
    tenants = await getApplicableTenants(perPage, tenants[tenants.length - 1].id)
  }
}
