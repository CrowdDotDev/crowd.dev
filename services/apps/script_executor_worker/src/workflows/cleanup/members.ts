import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { EntityType } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'

import * as activities from '../../activities'
import { ICleanupArgs } from '../../types'

const {
  getMembersToCleanup,
  deleteMember,
  syncMembersBatch,
  hasActivityRecords,
  excludeEntityFromCleanup,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function cleanupMembers(args: ICleanupArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100

  const memberIds = await getMembersToCleanup(BATCH_SIZE)

  if (memberIds.length === 0) {
    console.log('No more members to cleanup!')
    return
  }

  const CHUNK_SIZE = 10

  for (let i = 0; i < memberIds.length; i += CHUNK_SIZE) {
    const chunk = memberIds.slice(i, i + CHUNK_SIZE)

    const cleanupTasks = chunk.map(async (memberId) => {
      const isInQuestDb = await hasActivityRecords(memberId, EntityType.MEMBER)

      if (isInQuestDb) {
        console.log(`Member ${memberId} is in QuestDB, skipping!`)
        return excludeEntityFromCleanup(memberId, EntityType.MEMBER)
      }

      console.log(`Deleting member ${memberId} from database!`)
      await deleteMember(memberId)

      return syncMembersBatch([memberId], true)
    })

    await Promise.all(cleanupTasks)
  }

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof cleanupMembers>(args)
}
