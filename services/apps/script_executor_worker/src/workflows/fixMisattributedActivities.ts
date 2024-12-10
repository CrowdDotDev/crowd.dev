import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IFixMisattributedActivitiesArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minute',
  retry: { maximumAttempts: 3 },
})

export async function fixMisattributedActivities(
  args: IFixMisattributedActivitiesArgs,
): Promise<void> {
  const PROCESS_ACTIVITIES_PER_RUN = args.testRun ? 10 : 1000

  if (args.testRun) {
    console.log(`Running in test mode with limit 10!`)
  }

  const tenantId = args.tenantId

  const activitiesWithWrongMember = await activity.findActivitiesWithWrongMembers(
    tenantId,
    PROCESS_ACTIVITIES_PER_RUN,
  )

  if (!activitiesWithWrongMember.length) {
    console.log(`No activities found with misattributed members!`)
    return
  }

  for (const a of activitiesWithWrongMember) {
    const memberIdentity = await activity.findMemberIdentity(a.username, a.platform, tenantId)
    if (memberIdentity) {
      await activity.updateActivityWithWrongMember(a.id, memberIdentity.memberId)
    }
  }

  if (!args.testRun) {
    await continueAsNew<typeof fixMisattributedActivities>({
      testRun: args.testRun,
      tenantId: args.tenantId,
    })
  }
}
