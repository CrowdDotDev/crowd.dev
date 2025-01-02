import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IFixMisattributedActivitiesArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '60 minutes',
})

export async function fixMisattributedActivities(
  args: IFixMisattributedActivitiesArgs,
): Promise<void> {
  // Read CSV file
  const records = await activity.findActivitiesWithWrongMembers()

  if (!records.length) {
    console.log(`No activities found in the CSV file!`)
    return
  }

  let processedMemberCount = 0
  const totalRecords = records.length

  // Process each record from CSV
  for (const record of records) {
    console.log(`Updating ${record.correctMemberId} member activities updatedAt`)

    await activity.updateMemberActivitiesUpdatedAt(record.correctMemberId)

    processedMemberCount++

    if (args.testRun && processedMemberCount >= 10) {
      console.log('Test run complete!')
      break
    }

    console.log(`Processed ${processedMemberCount}/${totalRecords} members in the CSV file!`)
  }

  console.log('Completed processing all members!')
}
