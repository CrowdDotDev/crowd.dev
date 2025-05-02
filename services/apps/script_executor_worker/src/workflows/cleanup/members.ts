import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { chunkArray } from '@crowd/common'

import * as activities from '../../activities'
import { IScriptBatchTestArgs } from '../../types'

const { getMembersToCleanup, deleteMember, syncRemoveMember } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function cleanupMembers(args: IScriptBatchTestArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100

  const memberIds = await getMembersToCleanup(BATCH_SIZE)

  if (memberIds.length === 0) {
    console.log('No more members to cleanup!')
    return
  }

  const CHUNK_SIZE = 25

  for (const chunk of chunkArray(memberIds, CHUNK_SIZE)) {
    const cleanupTasks = chunk.map(async (memberId) => {
      await syncRemoveMember(memberId)
      return deleteMember(memberId)
    })

    await Promise.all(cleanupTasks).catch((err) => {
      console.error('Error cleaning up members!', err)
    })
  }

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof cleanupMembers>(args)
}
