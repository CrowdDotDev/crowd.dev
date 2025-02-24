import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities/computeAggs/organization'
import { IProcessComputeOrgAggs } from '../../types'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '10 minutes' })

export async function computeOrgAggsAndUpdate(args: IProcessComputeOrgAggs): Promise<void> {
  if (args.organizationIds.length === 0) {
    console.log('No organization IDs to process!')
    return
  }

  for (const orgId of args.organizationIds) {
    const orgExists = await activity.checkOrganizationExists(orgId)

    if (!orgExists) {
      console.log(`Organization ${orgId} does not exist. Skipping!`)
      await activity.dropOrgIdFromRedis(orgId)
      continue
    }

    await activity.syncOrganization(orgId)

    await activity.dropOrgIdFromRedis(orgId)
  }
}
