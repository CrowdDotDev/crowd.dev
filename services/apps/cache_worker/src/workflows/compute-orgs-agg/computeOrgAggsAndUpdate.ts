import { IProcessComputeOrgAggs } from '../../types'
import * as activities from '../../activities/computeAggs/organization'
import { proxyActivities } from '@temporalio/workflow'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function computeOrgAggsAndUpdate(args: IProcessComputeOrgAggs): Promise<void> {
  const orgId = args.organizationId

  const results = await activity.getOrgAggs(orgId)

  for (const orgData of results) {
    await activity.storeOrgAggsInDb(orgData)
  }

  await activity.dropOrgIdFromRedis(orgId)
}
