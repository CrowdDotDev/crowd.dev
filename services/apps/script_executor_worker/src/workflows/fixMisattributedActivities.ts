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

  const startIndex = Number(args.startIndex)

  if (!startIndex) {
    console.log('something wrong with startIndex')
    return
  }

  console.log(`Starting at record ${startIndex}`)

  // Skip records that were already processed
  const remainingRecords = records.slice(startIndex)

  if (!remainingRecords.length) {
    console.log(`No remaining records to process after skipping ${startIndex} records!`)
    return
  }

  let processedMemberCount = 0
  const totalRecords = remainingRecords.length

  // Process each record from CSV
  for (const record of remainingRecords) {
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
