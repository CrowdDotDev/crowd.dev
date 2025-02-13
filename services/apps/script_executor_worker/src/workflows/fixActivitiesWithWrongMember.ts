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

  let records = await activity.findActivitiesWithWrongMembers(BATCH_SIZE)

  if (!records.length) {
    console.log(`No activities found!`)
    return
  }

  while (records.length > 0) {
    for (const record of records) {
      console.log(`Processing activity with memberId: ${record.memberId}`)

      const memberIdentity = await activity.findMemberIdentity(record.username, record.platform)
      if (!memberIdentity) {
        console.log(`Member identity not found for ${record.username} on ${record.platform}`)
        continue
      }

      await activity.updateActivitiesWithWrongMember(record.memberId, memberIdentity.memberId)
    }

    records = await activity.findActivitiesWithWrongMembers(BATCH_SIZE)
  }

  console.log('Completed processing all members!')
}
