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
  const PROCESS_ACTIVITIES_PER_RUN = 5

  const memberIds = new Set<string>()

  const activitiesWithWrongMemberId = await activity.findActivitiesWithWrongMemberId(
    args.tenantId,
    PROCESS_ACTIVITIES_PER_RUN,
  )

  if (activitiesWithWrongMemberId.length === 0) {
    console.log(`Finished processing!`)
    return
  }

  for (const activity of activitiesWithWrongMemberId) {
    console.log(`Setting activity [${activity.id}] memberId to [${activity.correctMemberId}]! `)
    await activities.updateActivityMember(activity.id, activity.correctMemberId)
    memberIds.add(activity.correctMemberId)
    memberIds.add(activity.wrongMemberId)
  }

  for (const memberId of Array.from(memberIds)) {
    console.log(`Syncing member [${memberId}] to opensearch!`)
    await common.syncMember(memberId)
  }

  // await continueAsNew<typeof fixActivitiesWithWrongMembers>({
  //   tenantId: args.tenantId,
  // })
}
