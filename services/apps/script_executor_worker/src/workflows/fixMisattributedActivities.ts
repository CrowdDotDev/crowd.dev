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

  // Convert to number to ensure proper arithmetic
  const startIndex = Number(restartIndex)

  // Skip records that were already processed
  const remainingRecords = records.slice(startIndex)

  if (!remainingRecords.length) {
    console.log(`No remaining records to process after skipping ${startIndex} records!`)
    return
  }

  let processedMemberCount = startIndex
  const totalRecords = records.length

  console.log(`Found ${totalRecords} records to process`)
  console.log(`Starting at record ${startIndex + 1}`)

  // Process each record from CSV
  for (const record of remainingRecords) {
    console.log(
      `Fixing activities with wrong member ${record.wrongMemberId} -> ${record.correctMemberId}`,
    )

    await activity.batchUpdateActivitiesWithWrongMember(
      record.wrongMemberId,
      record.correctMemberId,
    )

    processedMemberCount++

    // Log progress with explicit number conversion
    console.log(
      `Processed ${Number(processedMemberCount)}/${Number(totalRecords)} members in the CSV file!`,
    )
  }

  console.log('Completed processing all members!')
}
