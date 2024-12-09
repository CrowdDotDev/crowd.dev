import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/fix-misattributed-activities'
import { IFixMisattributedActivitiesArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 minute',
  retry: { maximumAttempts: 3 },
})

export async function fixMisattributedActivities(
  args: IFixMisattributedActivitiesArgs,
): Promise<void> {
  const PROCESS_ACTIVITIES_PER_RUN = args.testRun ? 10 : 100

  if (args.testRun) {
    console.log(`Running in test mode with limit 10!`)
  }

  const activitiesWithWrongMember = await activity.findActivitiesWithWrongMembers(
    PROCESS_ACTIVITIES_PER_RUN,
  )

  if (!activitiesWithWrongMember.length) {
    console.log(`No activities found with misattributed members!`)
    return
  }

  for (const a of activitiesWithWrongMember) {
    const memberIdentity = await activity.findMemberIdentity(a.username, a.platform)
    console.log('activity with wrong member', a)
    console.log('memberIdentity found for username and platform', memberIdentity)
    // if (memberIdentity) {
    //   await activity.updateActivities(a.username, a.platform, memberIdentity.memberId)
    // }
  }

  if (!args.testRun) {
    await continueAsNew<typeof fixMisattributedActivities>({
      testRun: args.testRun,
    })
  }
}
