import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities/computeAggs/organization'
import { IProcessComputeOrgAggs } from '../../types'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '30 minutes' })

export async function computeOrgAggsAndUpdate(args: IProcessComputeOrgAggs): Promise<void> {
  const orgId = args.organizationId

  const orgExists = await activity.checkOrganizationExists(orgId)

  if (!orgExists) {
    console.log(`Organization ${orgId} does not exist. Skipping!`)
    await activity.dropOrgIdFromRedis(orgId)
    return
  }

  await activity.syncOrganization(orgId)

  await activity.dropOrgIdFromRedis(orgId)
}
