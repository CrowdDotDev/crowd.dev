import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities/computeAggs/organization'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '15 minutes' })

/*
  dailyGetAndComputeOrgAggs is a Temporal workflow that:
    - [Activity]: Get organization IDs from Redis.
    - [Child Workflow]: Re-compute and update aggregates for each organization 
      in batches of 50. Child workflows run independently and won't be 
      cancelled if the parent workflow stops.
  */
export async function checkRedis(): Promise<void> {
  const { cursor, organizationIds } = await activity.getOrgIdsFromRedis()

  console.log('cursor', cursor)
  console.log('organizationIds', organizationIds)
}
