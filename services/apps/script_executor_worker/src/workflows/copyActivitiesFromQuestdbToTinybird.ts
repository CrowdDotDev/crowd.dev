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
  } else {
    latestSyncedActivityTimestamp =
      args.latestSyncedActivityTimestamp ||
      (await activity.getLatestSyncedActivityTimestampForSyncingActivitiesToTinybird())
  }

  const { activitiesLength, activitiesRedisKey, lastTimestamp } =
    await activity.getActivitiesToCopyToTinybird(
      latestSyncedActivityTimestamp ?? undefined,
      BATCH_SIZE_PER_RUN,
      args.segmentIds ?? [],
    )

  if (activitiesLength === 0) {
    return
  }

  if (activitiesLength < BATCH_SIZE_PER_RUN) {
    if (lastTimestamp === args.latestSyncedActivityTimestamp) {
      return
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
