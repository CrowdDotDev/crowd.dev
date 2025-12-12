import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IFixActivityRelationsMemberIdArgs } from '../types'
import { chunkArray } from '../utils/common'

const {
  findMembersWithWrongActivityRelations,
  findMemberIdByUsernameAndPlatform,
  moveActivityRelations,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function fixActivityRelationsMemberId(
  args: IFixActivityRelationsMemberIdArgs,
): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 500
  const platform = args.platform

  // get wrong memberId, username, platform from activity relations
  const records = await findMembersWithWrongActivityRelations(platform, BATCH_SIZE)

  if (records.length === 0) {
    console.log('No more activity relations to fix!')
    return
  }

  for (const chunk of chunkArray(records, 50)) {
    if (args.testRun) console.log('Processing chunk', chunk)

    const tasks = chunk.map(async (record) => {
      // find the correct member id by username and platform
      const correctMemberId = await findMemberIdByUsernameAndPlatform(
        record.username,
        record.platform,
      )

      if (args.testRun) {
        console.log('Moving activity relations!', {
          fromId: record.memberId,
          toId: correctMemberId,
          username: record.username,
          platform: record.platform,
        })
      }

      // move activity relations to the correct member
      await moveActivityRelations(
        record.memberId,
        correctMemberId,
        record.username,
        record.platform,
      )
    })

    // parallel process the updates
    await Promise.all(tasks)
  }

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof fixActivityRelationsMemberId>(args)
}
