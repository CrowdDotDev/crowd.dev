import {
  proxyActivities,
  startChild,
  ParentClosePolicy,
  ChildWorkflowCancellationType,
  workflowInfo,
} from '@temporalio/workflow'

import * as activities from '../../activities/computeAggs/organization'
import { computeOrgAggsAndUpdate } from './computeOrgAggsAndUpdate'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

/*
dailyGetAndComputeOrgAggs is a Temporal workflow that:
  - [Activity]: Get organization IDs from Redis.
  - [Child Workflow]: Re-compute and update aggregates for each organization.
    previous activity. Child workflows are completely "detached" from the parent
    workflow, meaning they will continue to run and not be cancelled even if this
    one is.
*/
export async function dailyGetAndComputeOrgAggs(): Promise<void> {
  const organizationIds = await activity.getOrgIdsFromRedis()
  const info = workflowInfo()

  await Promise.all(
    organizationIds.map((organizationId) => {
      return startChild(computeOrgAggsAndUpdate, {
        workflowId: `${info.workflowId}/${organizationId}`,
        cancellationType: ChildWorkflowCancellationType.ABANDON,
        parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
        retry: {
          backoffCoefficient: 2,
          initialInterval: 2 * 1000,
          maximumInterval: 30 * 1000,
        },
        args: [
          {
            organizationId,
          },
        ],
        searchAttributes: {
          organizationId: [organizationId],
        },
      })
    }),
  )
}
