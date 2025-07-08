import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { IScriptBatchTestArgs } from '../../types'
import { chunkArray } from '../../utils/common'

const { getActivityRelationsWithNullSourceId, deleteActivityRelations } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function cleanupActivityRelationsWithSourceIdNull(
  args: IScriptBatchTestArgs,
): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 5000

  const activityIds = await getActivityRelationsWithNullSourceId(BATCH_SIZE)

  if (activityIds.length === 0) {
    console.log('No more activity relations with sourceId null to cleanup!')
    return
  }

  const CHUNK_SIZE = 2500
  const chunked = chunkArray(activityIds, CHUNK_SIZE)

  await Promise.all(
    chunked.map(async (chunk) => {
      try {
        await deleteActivityRelations(chunk)
      } catch (err) {
        console.error('Error cleaning up activity relations with sourceId null!', err)
      }
    }),
  )

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof cleanupActivityRelationsWithSourceIdNull>(args)
}
