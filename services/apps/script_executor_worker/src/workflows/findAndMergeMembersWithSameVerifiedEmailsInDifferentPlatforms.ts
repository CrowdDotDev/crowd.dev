import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as commonActivities from '../activities/common'
import * as activities from '../activities/merge-members-with-similar-identities'
import { IFindAndMergeMembersWithSameVerifiedEmailsInDifferentPlatformsArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 minute',
  retry: { maximumAttempts: 3 },
})

const common = proxyActivities<typeof commonActivities>({
  startToCloseTimeout: '5 minute',
  retry: { maximumAttempts: 6, backoffCoefficient: 3 },
})

export async function findAndMergeMembersWithSameVerifiedEmailsInDifferentPlatforms(
  args: IFindAndMergeMembersWithSameVerifiedEmailsInDifferentPlatformsArgs,
): Promise<void> {
  const PROCESS_MEMBERS_PER_RUN = 1000

  const mergeableMemberCouples =
    await activity.findMembersWithSameVerifiedEmailsInDifferentPlatforms(
      args.tenantId,
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

  await continueAsNew<typeof findAndMergeMembersWithSameVerifiedEmailsInDifferentPlatforms>({
    tenantId: args.tenantId,
    afterHash: mergeableMemberCouples[mergeableMemberCouples.length - 1]?.hash,
  })
}
