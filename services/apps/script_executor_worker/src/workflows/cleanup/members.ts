import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { EntityType } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'

import * as cleanupHelpers from '../../activities/cleanup/helpers'
import * as activities from '../../activities/cleanup/member'
import * as syncActivities from '../../activities/sync/member'
import { ICleanupArgs } from '../../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

const cleanupHelper = proxyActivities<typeof cleanupHelpers>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

const syncActivity = proxyActivities<typeof syncActivities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function cleanupMembers(args: ICleanupArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100

  const memberIds = await activity.getMembersToCleanup(BATCH_SIZE)

  if (memberIds.length === 0) {
    console.log('No more members to cleanup!')
    return
  }

  const CHUNK_SIZE = 10

  for (let i = 0; i < memberIds.length; i += CHUNK_SIZE) {
    const chunk = memberIds.slice(i, i + CHUNK_SIZE)

    const cleanupTasks = chunk.map(async (memberId) => {
      const isInQuestDb = await cleanupHelper.hasActivityRecords(memberId, EntityType.MEMBER)

      if (isInQuestDb) {
        console.log(`Member ${memberId} is in QuestDB, skipping!`)
        return cleanupHelper.excludeEntityFromCleanup(memberId, EntityType.MEMBER)
      }

      console.log(`Deleting member ${memberId} from database!`)

      await activity.deleteMember(memberId)
      return syncActivity.syncMembersBatch([memberId], true)
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
