import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IRefreshMemberAffiliationsArgs } from '../types'

const { calculateMemberAffiliations } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function refreshMemberAffiliations(
  args: IRefreshMemberAffiliationsArgs,
): Promise<void> {
  const memberIds = args.memberIds ?? []

  if (memberIds.length === 0) {
    console.log('No member ids to refresh!')
    return
  }

  for (const memberId of memberIds) {
    await calculateMemberAffiliations(memberId)
  }
}
