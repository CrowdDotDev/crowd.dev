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
  const BUFFER_TARGET = args.bufferTargetSize ?? 50

  // Always use all platforms every run
  const platforms = Object.values(PlatformType)
  let currentPlatformIndex = args.currentPlatformIndex ?? 0

  const recordsBuffer = []

  while (recordsBuffer.length < BUFFER_TARGET && currentPlatformIndex < platforms.length) {
    const platform = platforms[currentPlatformIndex]

    if (args.testRun) {
      console.log('Current platform:', platform)
    }

    const records = await findMembersWithWrongActivityRelations(platform, BATCH_SIZE)

    if (records.length === 0) {
      console.log(`Platform ${platform} returned 0 results. Skipping.`)
      currentPlatformIndex++ // Move to next platform
      continue
    }

    // Fill buffer from this platform
    const slotsLeft = BUFFER_TARGET - recordsBuffer.length
    recordsBuffer.push(...records.slice(0, slotsLeft))
  }

  // No more platforms and empty buffer → stop workflow
  if (recordsBuffer.length === 0) {
    console.log('No more activity relations to fix!')
    return
  }

  // Process the batch (even if < BUFFER_TARGET)
  await Promise.all(
    recordsBuffer.map(async (record) => {
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

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue workflow at the next platform
  await continueAsNew<typeof fixActivityRelationsMemberId>({
    ...args,
    currentPlatformIndex,
  })
}
