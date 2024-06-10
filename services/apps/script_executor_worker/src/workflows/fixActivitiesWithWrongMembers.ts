import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/fix-activities-with-wrong-members'
import * as commonActivities from '../activities/common'
import { IFixActivitiesWithWrongMembersArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 minute',
  retry: { maximumAttempts: 3 },
})

const common = proxyActivities<typeof commonActivities>({
  startToCloseTimeout: '5 minute',
  retry: { maximumAttempts: 6, backoffCoefficient: 3 },
})

export async function fixActivitiesWithWrongMembers(
  args: IFixActivitiesWithWrongMembersArgs,
): Promise<void> {
  const PROCESS_ACTIVITIES_PER_RUN = 1000

  const memberIds = new Set<string>()

  const activitiesWithWrongMemberId = await activity.findActivitiesWithWrongMemberId(
    args.tenantId,
    PROCESS_ACTIVITIES_PER_RUN,
  )

  if (activitiesWithWrongMemberId.length === 0) {
    console.log(`Finished processing!`)
    return
  }

  for (const currentActivity of activitiesWithWrongMemberId) {
    console.log(
      `Changing activity [${currentActivity.id}] memberId from [${currentActivity.wrongMemberId}] to [${currentActivity.correctMemberId}]! `,
    )
    await activity.updateActivityMember(currentActivity.id, currentActivity.correctMemberId)
    memberIds.add(currentActivity.correctMemberId)
    memberIds.add(currentActivity.wrongMemberId)
  }

  console.log(`Syncing moved activities to opensearch!`)
  await common.syncActivities(activitiesWithWrongMemberId.map((a) => a.id))

  for (const memberId of Array.from(memberIds)) {
    console.log(
      `Syncing member [${memberId}] to opensearch & triggering recalculation of affiliations!`,
    )
    await common.syncMember(memberId)

    // We should also recalculate affiliations for members that we moved the activites to
    // so activity.organizatonIds of the moved activites are also updated
    if (activitiesWithWrongMemberId.map((a) => a.correctMemberId).includes(memberId)) {
      await common.recalculateActivityAffiliationsOfMemberAsync(memberId, args.tenantId)
    }
  }

  console.log('Finished this run. Continuing as new for next batch!')

  await continueAsNew<typeof fixActivitiesWithWrongMembers>({
    tenantId: args.tenantId,
  })
}
