import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/unlink-deleted-memberOrg-activities'
import { IUnlinkDeletedMemberOrgArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '45 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function fixMemberActivitiesAffilation(
  args: IUnlinkDeletedMemberOrgArgs,
): Promise<void> {
  console.log('Starting to fix affiliations for member: ', args.memberId)

  await activity.calculateMemberAffiliations(args.memberId)

  console.log('Finished fixing affiliations!')
}
