import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { ICleanupDuplicateMembersArgs } from '../../types'
import { chunkArray } from '../../utils/common'

const { findDuplicateMembersAfterDate, moveMemberActivityRelations } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '15 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function cleanupDuplicateMembers(args: ICleanupDuplicateMembersArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 500
  const cutoffDate = args.cutoffDate ?? '2025-05-18'

  const results = await findDuplicateMembersAfterDate(cutoffDate, BATCH_SIZE)

  if (results.length === 0) {
    console.log('No more duplicate members to cleanup!')
    return
  }

  let processedCount = 0
  const startTime = Date.now()

  // chunk and execute in parallel
  for (const chunk of chunkArray(results, 50)) {
    const batchStartTime = Date.now()

    await Promise.all(
      chunk.map((result) => {
        console.log(`Moving activity relations: ${result.secondaryId} --> ${result.primaryId}`)
        return moveMemberActivityRelations(result.primaryId, result.secondaryId)
      }),
    )

    processedCount += chunk.length
    const batchTime = (Date.now() - batchStartTime) / 1000
    const totalTime = (Date.now() - startTime) / 1000
    const itemsPerSecond = processedCount / totalTime

    console.log(`Processed batch in ${batchTime.toFixed(1)}s`)
    console.log(`Processing ${itemsPerSecond.toFixed(1)} items/sec`)
  }

  // Note: Secondary members are not deleted here. The cleanupMembers workflow will automatically
  // pick them up later since they'll have no activities, identities, or memberOrganizations.

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  await continueAsNew<typeof cleanupDuplicateMembers>(args)
}
