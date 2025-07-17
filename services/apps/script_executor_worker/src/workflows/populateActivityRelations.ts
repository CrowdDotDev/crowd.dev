import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/populate-activity-relations'
import { IPopulateActivityRelationsArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 minute',
  retry: { maximumAttempts: 3 },
})

export async function populateActivityRelations(
  args: IPopulateActivityRelationsArgs,
): Promise<void> {
  const BATCH_SIZE_PER_RUN = args.batchSizePerRun || 1000
  const latestSyncedActivityCreatedAt = args.latestSyncedActivityCreatedAt

  // if (args.deleteIndexedEntities) {
  //   await activity.resetIndexedIdentities()
  //   latestSyncedActivityTimestamp = null
  // } else {
  //   latestSyncedActivityTimestamp =
  //     args.latestSyncedActivityTimestamp || (await activity.getLatestSyncedActivityTimestamp())
  // }

  let { activitiesLength, activitiesRedisKey, lastCreatedAt } = await activity.getActivitiesToCopy(
    latestSyncedActivityCreatedAt ?? undefined,
    BATCH_SIZE_PER_RUN,
    args.segmentIds,
  )

  if (activitiesLength === 0) {
    return
  }

  if (lastCreatedAt === args.latestSyncedActivityCreatedAt) {
    if (activitiesLength < BATCH_SIZE_PER_RUN) {
      return
    }

    // All activities returned have the same timestamp, we need a bigger batch size
    // then the default one to pass this point
    let batchSizeMultiplier = 2

    while (lastCreatedAt === args.latestSyncedActivityCreatedAt) {
      const result = await activity.getActivitiesToCopy(
        lastCreatedAt,
        BATCH_SIZE_PER_RUN * batchSizeMultiplier,
        args.segmentIds,
      )
      activitiesLength = result.activitiesLength
      activitiesRedisKey = result.activitiesRedisKey
      lastCreatedAt = result.lastCreatedAt
      batchSizeMultiplier += 1
    }
  }

  await activity.createRelations(activitiesRedisKey)

  await activity.markActivitiesAsIndexed(activitiesRedisKey)

  await continueAsNew<typeof populateActivityRelations>({
    batchSizePerRun: args.batchSizePerRun,
    latestSyncedActivityCreatedAt: lastCreatedAt,
  })
}
