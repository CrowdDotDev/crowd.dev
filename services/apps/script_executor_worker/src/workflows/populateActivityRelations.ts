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
  let latestSyncedActivityTimestamp

  if (args.deleteIndexedEntities) {
    await activity.resetIndexedIdentities()
    latestSyncedActivityTimestamp = null
  } else {
    latestSyncedActivityTimestamp =
      args.latestSyncedActivityTimestamp || (await activity.getLatestSyncedActivityTimestamp())
  }

  const { activitiesLength, activitiesRedisKey, lastTimestamp } =
    await activity.getActivitiesToCopy(
      latestSyncedActivityTimestamp ?? undefined,
      BATCH_SIZE_PER_RUN,
    )

  if (activitiesLength === 0) {
    return
  }

  if (activitiesLength < BATCH_SIZE_PER_RUN) {
    if (lastTimestamp === args.latestSyncedActivityTimestamp) {
      return
    }
  }

  await activity.createRelations(activitiesRedisKey)

  await activity.markActivitiesAsIndexed(activitiesRedisKey)

  await continueAsNew<typeof populateActivityRelations>({
    batchSizePerRun: args.batchSizePerRun,
    latestSyncedActivityTimestamp: lastTimestamp,
  })
}
