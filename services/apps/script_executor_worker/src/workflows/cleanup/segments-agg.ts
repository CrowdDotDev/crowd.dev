import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { IScriptBatchTestArgs } from '../../types'
import { chunkArray } from '../../utils/common'

const {
  startOrphanCleanupRun,
  updateOrphanCleanupRun,
  getOrphanMembersSegmentsAgg,
  deleteOrphanMembersSegmentsAgg,
  getOrphanOrganizationSegmentsAgg,
  deleteOrphanOrganizationSegmentsAgg,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function cleanupMemberSegmentsAgg(args: IScriptBatchTestArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100
  const AGGREGATE_NAME = 'memberSegmentsAgg'

  let runId: string | undefined
  let totalOrphansFound = 0
  let totalOrphansDeleted = 0
  const startTime = Date.now()

  try {
    // Initialize the cleanup run only on the first iteration
    if (!args.cleanupRunId) {
      runId = await startOrphanCleanupRun(AGGREGATE_NAME)
      console.log(`Started cleanup run for ${AGGREGATE_NAME} with ID: ${runId}`)
    } else {
      runId = args.cleanupRunId
    }

    // Get orphaned records
    const orphanIds = await getOrphanMembersSegmentsAgg(BATCH_SIZE)

    if (orphanIds.length === 0) {
      // Update the cleanup run as completed
      if (runId) {
        await updateOrphanCleanupRun(runId, {
          completedAt: new Date(),
          status: 'completed',
          executionTimeMs: Date.now() - startTime,
        })
      }

      return
    }
    totalOrphansFound += orphanIds.length

    // Process orphans in chunks
    const CHUNK_SIZE = 25
    let deletedCount = 0

    for (const chunk of chunkArray(orphanIds, CHUNK_SIZE)) {
      const deleteTasks = chunk.map(async (id) => {
        await deleteOrphanMembersSegmentsAgg(id)
        deletedCount++
      })

      await Promise.all(deleteTasks).catch((err) => {
        console.error(`Error cleaning up orphan ${AGGREGATE_NAME} records!`, err)
        throw err
      })
    }
    totalOrphansDeleted += deletedCount

    // Update the cleanup run with current progress
    if (runId) {
      await updateOrphanCleanupRun(runId, {
        orphansFound: totalOrphansFound,
        orphansDeleted: totalOrphansDeleted,
      })
    }

    // Continue as new for the next batch
    await continueAsNew<typeof cleanupMemberSegmentsAgg>({
      ...args,
      cleanupRunId: runId,
    })
  } catch (error) {
    // Update the cleanup run as failed
    if (runId) {
      await updateOrphanCleanupRun(runId, {
        completedAt: new Date(),
        status: 'failed',
        errorMessage: error.message || String(error),
        executionTimeMs: Date.now() - startTime,
      })
    }

    throw error
  }
}

export async function cleanupOrganizationSegmentAgg(args: IScriptBatchTestArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100
  const AGGREGATE_NAME = 'organizationSegmentsAgg'

  let runId: string | undefined
  let totalOrphansFound = 0
  let totalOrphansDeleted = 0
  const startTime = Date.now()

  try {
    // Initialize the cleanup run only on the first iteration
    if (!args.cleanupRunId) {
      runId = await startOrphanCleanupRun(AGGREGATE_NAME)
      console.log(`Started cleanup run for ${AGGREGATE_NAME} with ID: ${runId}`)
    } else {
      runId = args.cleanupRunId
    }

    // Get orphaned records
    const orphanIds = await getOrphanOrganizationSegmentsAgg(BATCH_SIZE)

    if (orphanIds.length === 0) {
      // Update the cleanup run as completed
      if (runId) {
        await updateOrphanCleanupRun(runId, {
          completedAt: new Date(),
          status: 'completed',
          executionTimeMs: Date.now() - startTime,
        })
      }

      return
    }
    totalOrphansFound += orphanIds.length

    // Process orphans in chunks
    const CHUNK_SIZE = 25
    let deletedCount = 0

    for (const chunk of chunkArray(orphanIds, CHUNK_SIZE)) {
      const deleteTasks = chunk.map(async (id) => {
        await deleteOrphanOrganizationSegmentsAgg(id)
        deletedCount++
      })

      await Promise.all(deleteTasks).catch((err) => {
        console.error(`Error cleaning up orphan ${AGGREGATE_NAME} records!`, err)
        throw err
      })
    }

    totalOrphansDeleted += deletedCount
    // Update the cleanup run with current progress
    if (runId) {
      await updateOrphanCleanupRun(runId, {
        orphansFound: totalOrphansFound,
        orphansDeleted: totalOrphansDeleted,
      })
    }

    // Continue as new for the next batch
    await continueAsNew<typeof cleanupOrganizationSegmentAgg>({
      ...args,
      cleanupRunId: runId,
    })
  } catch (error) {
    // Update the cleanup run as failed
    if (runId) {
      await updateOrphanCleanupRun(runId, {
        completedAt: new Date(),
        status: 'failed',
        errorMessage: error.message || String(error),
        executionTimeMs: Date.now() - startTime,
      })
    }

    throw error
  }
}
