import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '60 minutes',
})

export async function fixMisattributedActivities(restartIndex = 0): Promise<void> {
  // Read CSV file
  const records = await activity.findActivitiesWithWrongMembers()

  if (!records.length) {
    console.log(`No activities found in the CSV file!`)
    return
  }

  // Skip records that were already processed
  const remainingRecords = records.slice(restartIndex)

  if (!remainingRecords.length) {
    console.log(`No remaining records to process after skipping ${restartIndex} records!`)
    return
  }

  let processedMemberCount = restartIndex
  const totalRecords = records.length

  // Process each record from CSV
  for (const record of remainingRecords) {
    await activity.batchUpdateActivitiesWithWrongMember(
      record.wrongMemberId,
      record.correctMemberId,
    )

    processedMemberCount++

    // Log progress
    console.log(`Processed ${processedMemberCount}/${totalRecords} members in the CSV file!`)
  }

  console.log('Completed processing all members!')
}
