import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../src/activities/fix-activities-with-wrong-member'
import { IFixActivitiesWithWrongMembersArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '45 minutes',
})

export async function fixActivitiesWithWrongMember(
  args: IFixActivitiesWithWrongMembersArgs,
): Promise<void> {
  const BATCH_SIZE = args.testRun ? 10 : args.limit

  if (args.testRun) {
    console.log('Test run enabled so processing only 10 records!')
  }

  const records = await activity.findActivitiesWithWrongMembers(BATCH_SIZE)

  if (!records.length) {
    console.log(`No activities found!`)
    return
  }

  for (const record of records) {
    console.log(
      `Processing recording with memberId: ${record.memberId} value: ${record.username} platform: ${record.platform}`,
    )

    const memberIdentity = await activity.findMemberIdentity(record.username, record.platform)
    if (!memberIdentity) {
      console.log(`Member identity not found!`)
      continue
    }

    await activity.updateActivitiesWithWrongMember(record.memberId, memberIdentity.memberId)
  }

  console.log('Completed processing all members!')
}
