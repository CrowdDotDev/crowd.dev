import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'

const { deleteMember, moveActivitiesBetweenMembers } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
})

export async function finishMemberMerging(
  primaryId: string,
  secondaryId: string,
  tenantId: string,
): Promise<void> {
  await moveActivitiesBetweenMembers(primaryId, secondaryId, tenantId)
  await deleteMember(secondaryId)
}
