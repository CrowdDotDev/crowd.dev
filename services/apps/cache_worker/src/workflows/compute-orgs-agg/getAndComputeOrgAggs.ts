import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  continueAsNew,
  executeChild,
  proxyActivities,
  workflowInfo,
} from '@temporalio/workflow'

import * as activities from '../../activities/computeAggs/organization'

import { computeOrgAggsAndUpdate } from './computeOrgAggsAndUpdate'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '15 minutes' })

/*
dailyGetAndComputeOrgAggs is a Temporal workflow that:
  - [Activity]: Get organization IDs from Redis.
  - [Child Workflow]: Re-compute and update aggregates for each organization 
    in batches of 50. Child workflows run independently and won't be 
    cancelled if the parent workflow stops.
*/
export async function dailyGetAndComputeOrgAggs(): Promise<void> {
  const { cursor, organizationIds } = await activity.getOrgIdsFromRedis()

  console.log('cursor', cursor)
  console.log('organizationIds', organizationIds)

  if (organizationIds.length === 0) {
    console.log('No more organizations to process. Workflow completed successfully!')
    return
  }

  const info = workflowInfo()

  await Promise.all(
    organizationIds.map((organizationId) => {
      return executeChild(computeOrgAggsAndUpdate, {
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
  if (cursor !== '0') {
    await continueAsNew<typeof dailyGetAndComputeOrgAggs>()
  }
}
