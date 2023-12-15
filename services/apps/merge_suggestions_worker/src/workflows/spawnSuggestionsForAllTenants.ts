import {
  proxyActivities,
  startChild,
  ParentClosePolicy,
  ChildWorkflowCancellationType,
  workflowInfo,
} from '@temporalio/workflow'

import * as activities from '../activities/getAllTenants'
import { generateMemberMergeSuggestions } from './generateMemberMergeSuggestions'

// Configure timeouts and retry policies to fetch emails to send.
const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function spawnSuggestionsForAllTenants(): Promise<void> {
  // const [tenants] = await Promise.all([getAllTenants()])
  const tenants = await activity.getAllTenants()
  console.log('Got all tenants! ')
  console.log(tenants)
  const info = workflowInfo()

  await Promise.all(
    tenants.map((tenant) => {
      return startChild(generateMemberMergeSuggestions, {
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
            tenantId: tenant.tenantId,
          },
        ],
        searchAttributes: {
          TenantId: [tenant.tenantId],
        },
      })
    }),
  )
}
