import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../src/activities/fix-activities-with-wrong-member'
import { IFixActivitiesWithWrongMembersArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '45 minutes',
})

export async function fixMisattributedActivities(
  args: IFixActivitiesWithWrongMembersArgs,
): Promise<void> {
  let records = await activity.findActivitiesWithWrongMembers(args.limit)

  if (!records.length) {
    console.log(`No activities found!`)
    return
  }

  if (args.testRun) {
    console.log('Test run enabled so processing only 10 records!')
    records = records.slice(0, 10)
  }

  for (const record of records) {
    console.log(
      `Processing record memberId: ${record.memberId} username: ${record.username} platform: ${record.platform}`,
    )

    const memberIdentity = await activity.findMemberIdentity(record.username, record.platform)
    if (!memberIdentity) {
      console.log(`Member identity not found!`)
      continue
    }

    await activity.updateActivitiesWithWrongMember(record.memberId, memberIdentity.memberId)
    console.log('Updated activities!')
  }

  console.log('Completed processing all members!')
}
