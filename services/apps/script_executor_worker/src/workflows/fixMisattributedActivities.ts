import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '60 minutes',
})

export async function fixMisattributedActivities(): Promise<void> {
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
    await activity.batchUpdateActivitiesWithWrongMember(
      record.wrongMemberId,
      record.correctMemberId,
    )

    processedMemberCount++

    // Log progress
    console.log(`Processed ${processedMemberCount}/${totalRecords} members in the CSV file!`)
  }
}
