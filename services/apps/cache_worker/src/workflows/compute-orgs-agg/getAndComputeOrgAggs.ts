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

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '10 minutes' })

/*
dailyGetAndComputeOrgAggs is a Temporal workflow that:
  - [Activity]: Get organization IDs from Redis.
  - [Child Workflow]: Re-compute and update aggregates for each organization 
    in batches of 10. Child workflows run independently and won't be 
    cancelled if the parent workflow stops.
*/
export async function dailyGetAndComputeOrgAggs(): Promise<void> {
  const organizationIds = await activity.getOrgIdsFromRedis()

  // If no orgIds found, return early
  if (!organizationIds) return

  const info = workflowInfo()
  const BATCH_SIZE = 10

  const batch = organizationIds.slice(0, BATCH_SIZE)
  await Promise.all(
    batch.map((organizationId) => {
      return executeChild(computeOrgAggsAndUpdate, {
        workflowId: `${info.workflowId}/${organizationId}`,
        cancellationType: ChildWorkflowCancellationType.ABANDON,
        parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
        retry: {
          backoffCoefficient: 2,
          initialInterval: 2 * 1000,
          maximumInterval: 30 * 1000,
        },
        args: [{ organizationId }],
      })
    }),
  )

  await continueAsNew()
}
