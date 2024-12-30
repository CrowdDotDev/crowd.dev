import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  proxyActivities,
  startChild,
  workflowInfo,
} from '@temporalio/workflow'

import * as activities from '../../activities'

import { recalculateAffiliationsForNewRoles } from './recalculateAffiliationsForNewRoles'

const { getAllTenants } = proxyActivities<typeof activities>({
  startToCloseTimeout: '60 seconds',
})

export async function triggerRecalculateAffiliationsForEachTenant(): Promise<void> {
  const tenants = await getAllTenants()
  const info = workflowInfo()

  await Promise.all(
    tenants.map((tenant) => {
      return startChild(recalculateAffiliationsForNewRoles, {
        workflowId: `${info.workflowId}/${tenant.tenantId}`,
        cancellationType: ChildWorkflowCancellationType.ABANDON,
        parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
        retry: {
          backoffCoefficient: 2,
          initialInterval: 2 * 1000,
          maximumInterval: 30 * 1000,
        },
        args: [
          {
            tenant: {
              id: tenant.tenantId,
            },
          },
        ],
        searchAttributes: {
          TenantId: [tenant.tenantId],
        },
      })
    }),
  )
}
