import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  continueAsNew,
  executeChild,
  proxyActivities,
  workflowInfo,
} from '@temporalio/workflow'

import * as activities from '../activities/computeAggs/organization'

import { processOrganizationAggregates } from './processOrganizationAggregates'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '15 minutes' })

/*
spawnOrganizationAggregatesComputation is a Temporal workflow that:
  - [Activity]: Get organization IDs from Redis.
  - [Child Workflow]: Re-compute and update aggregates for each organization 
    in batches of 100. Child workflows run independently and won't be 
    cancelled if the parent workflow stops.
*/
export async function spawnOrganizationAggregatesComputation(): Promise<void> {
  const { organizationIds, totalSize } = await activity.getOrganizationIdsFromRedis()

  if (!totalSize) {
    console.log('No organizations found - finishing workflow!')
    return
  }

  console.log(`Found ${totalSize} organizations for aggs computation!`)

  const info = workflowInfo()

  await Promise.all(
    organizationIds.map((organizationId) => {
      return executeChild(processOrganizationAggregates, {
        workflowId: `${info.workflowId}/${organizationId}`,
        cancellationType: ChildWorkflowCancellationType.ABANDON,
        parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
        retry: {
          backoffCoefficient: 2,
          initialInterval: 2 * 1000,
          maximumInterval: 30 * 1000,
          maximumAttempts: 3,
        },
        args: [{ organizationId }],
      })
    }),
  )

  // Continue with the next batch
  await continueAsNew<typeof spawnOrganizationAggregatesComputation>()
}
