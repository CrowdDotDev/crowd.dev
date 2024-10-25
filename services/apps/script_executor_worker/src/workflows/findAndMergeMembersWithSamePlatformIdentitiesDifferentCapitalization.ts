import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as commonActivities from '../activities/common'
import * as activities from '../activities/merge-members-with-similar-identities'
import { IFindAndMergeMembersWithSameIdentitiesDifferentCapitalizationInPlatformArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 minute',
  retry: { maximumAttempts: 3 },
})

const common = proxyActivities<typeof commonActivities>({
  startToCloseTimeout: '3 minute',
  retry: { maximumAttempts: 3 },
})

export async function findAndMergeMembersWithSamePlatformIdentitiesDifferentCapitalization(
  args: IFindAndMergeMembersWithSameIdentitiesDifferentCapitalizationInPlatformArgs,
): Promise<void> {
  const PROCESS_MEMBERS_PER_RUN = 10

  const mergeableMemberCouples =
    await activity.findMembersWithSamePlatformIdentitiesDifferentCapitalization(
      args.tenantId,
      args.platform,
      PROCESS_MEMBERS_PER_RUN,
      args.afterHash || undefined,
    )

  if (mergeableMemberCouples.length === 0) {
    console.log(`Finished processing!`)
    return
  }

  for (const couple of mergeableMemberCouples) {
    console.log(
      `Merging ${couple.secondaryMemberId} [${couple.secondaryMemberIdentityValue}] into ${couple.primaryMemberId} [${couple.primaryMemberIdentityValue}]! `,
    )
    await common.mergeMembers(couple.primaryMemberId, couple.secondaryMemberId, args.tenantId)
  }

  await continueAsNew<typeof findAndMergeMembersWithSamePlatformIdentitiesDifferentCapitalization>({
    tenantId: args.tenantId,
    platform: args.platform,
    afterHash: mergeableMemberCouples[mergeableMemberCouples.length - 1]?.hash,
  })
}
