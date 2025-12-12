import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { PlatformType } from '@crowd/types'

import * as activities from '../activities'
import { IFixActivityRelationsMemberIdArgs } from '../types'

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

  const platforms = Object.values(PlatformType)
  let currentPlatformIndex = args.currentPlatformIndex ?? 0

  if (currentPlatformIndex >= platforms.length) {
    console.log('All platforms exhausted. Workflow complete!')
    return
  }

  const platform = platforms[currentPlatformIndex]

  if (args.testRun) console.log('Processing platform:', platform)

  // Take a batch from current platform
  const records = await findMembersWithWrongActivityRelations(platform, BATCH_SIZE)

  if (records.length === 0) {
    console.log(`Platform ${platform} has no more records. Moving to next platform.`)
    currentPlatformIndex++
  } else {
    // Process the batch immediately
    await Promise.all(
      records.map(async (record) => {
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

        await moveActivityRelations(
          record.memberId,
          correctMemberId,
          record.username,
          record.platform,
        )
      }),
    )
  }

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue workflow for next batch (same platform or next platform)
  await continueAsNew<typeof fixActivityRelationsMemberId>({
    ...args,
    currentPlatformIndex,
  })
}
