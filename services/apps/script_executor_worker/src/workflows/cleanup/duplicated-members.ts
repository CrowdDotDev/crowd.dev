import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { ProcessingStats } from '../../activities/cleanup-duplicate-members'
import { svc } from '../../main'

const { processMembersInBatches } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function cleanupDuplicatedMembers(
  batchSize = 1000,
  cutoffDate = '2025-05-18',
): Promise<ProcessingStats> {
  try {
    const stats = await processMembersInBatches(batchSize, cutoffDate, async (progress) => {
      // Log progress after each batch
      svc.log.info(
        `Cleanup progress - Processed: ${progress.totalProcessed}, Merged: ${progress.totalMerged}, ` +
          `Remaining: ${progress.remainingMembers}, Batches: ${progress.batchesProcessed}`,
      )
    })

    svc.log.info(
      `Cleanup completed - Total processed: ${stats.totalProcessed}, Total merged: ${stats.totalMerged}, ` +
        `Remaining: ${stats.remainingMembers}, Total batches: ${stats.batchesProcessed}`,
    )

    return stats
  } catch (error) {
    svc.log.error(error, 'Error during duplicated members cleanup workflow!')
    throw error
  }
}
