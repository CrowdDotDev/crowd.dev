import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities/computeAggs/organization'
import { IProcessComputeOrgAggs } from '../../types'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function computeOrgAggsAndUpdate(args: IProcessComputeOrgAggs): Promise<void> {
  const orgId = args.organizationId

  const orgExists = await activity.checkOrganizationExists(orgId)

  if (!orgExists) {
    console.log(`organizationId ${orgId} does not exist!`)
    // rm orgId from redis so that it's not processed again
    await activity.dropOrgIdFromRedis(orgId)
    return
  }

  await activity.syncOrganization(orgId)

  await activity.dropOrgIdFromRedis(orgId)
}
