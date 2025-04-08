import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/copy-activities-from-questdb-to-tinybird'
import { ICopyActivitiesFromQuestDbToTinybirdArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 minute',
  retry: { maximumAttempts: 3 },
})

export async function copyActivitiesFromQuestdbToTinybird(
  args: ICopyActivitiesFromQuestDbToTinybirdArgs,
): Promise<void> {
  const BATCH_SIZE_PER_RUN = args.batchSizePerRun || 1000
  let latestSyncedActivityTimestamp

  if (args.deleteIndexedEntities) {
    await activity.resetIndexedIdentitiesForSyncingActivitiesToTinybird()
    latestSyncedActivityTimestamp = null
  } else {
    latestSyncedActivityTimestamp =
      args.latestSyncedActivityTimestamp ||
      (await activity.getLatestSyncedActivityTimestampForSyncingActivitiesToTinybird())
  }

  let { activitiesLength, activitiesRedisKey, lastTimestamp } =
    await activity.getActivitiesToCopyToTinybird(
      latestSyncedActivityTimestamp ?? undefined,
      BATCH_SIZE_PER_RUN,
      args.segmentIds ?? [],
    )

  if (activitiesLength === 0) {
    return
  }

  if (lastTimestamp === args.latestSyncedActivityTimestamp) {
    if (activitiesLength < BATCH_SIZE_PER_RUN) {
      return
    }

    // All activities returned have the same timestamp, we need a bigger batch size
    // then the default one to pass this point
    let batchSizeMultiplier = 2

    while (lastTimestamp === args.latestSyncedActivityTimestamp) {
      const result = await activity.getActivitiesToCopyToTinybird(
        lastTimestamp,
        BATCH_SIZE_PER_RUN * batchSizeMultiplier,
        args.segmentIds ?? [],
      )
      activitiesLength = result.activitiesLength
      activitiesRedisKey = result.activitiesRedisKey
      lastTimestamp = result.lastTimestamp
      batchSizeMultiplier += 1
    }
  }

  // 4- Send activities to tinybird
  await activity.sendActivitiesToTinybird(activitiesRedisKey)

  // 5- Mark activities as indexed
  await activity.markActivitiesAsIndexedForSyncingActivitiesToTinybird(activitiesRedisKey)

  await continueAsNew<typeof copyActivitiesFromQuestdbToTinybird>({
    batchSizePerRun: args.batchSizePerRun,
    latestSyncedActivityTimestamp: lastTimestamp,
    segmentIds: args.segmentIds,
  })
}
