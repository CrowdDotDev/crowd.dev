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

  if (args.deleteIndexedEntities) {
    await activity.deleteActivityIdsFromIndexedEntities()
  }

  const latestSyncedActivityId =
    args.lastIndexedActivityId || (await activity.getLatestSyncedActivityId())

  const { activitiesLength, activitiesRedisKey } = await activity.getActivitiesToCopy(
    latestSyncedActivityId ?? undefined,
    BATCH_SIZE_PER_RUN,
  )

  if (activitiesLength === 0) {
    return
  }

  if (activitiesLength < BATCH_SIZE_PER_RUN) {
    const lastSyncedActivityId = await activity.getLatestSyncedActivityId()
    if (lastSyncedActivityId === args.lastIndexedActivityId) {
      return
    }
  }

  await activity.createRelations(activitiesRedisKey)

  const lastIndexedActivityId = await activity.markActivitiesAsIndexed(activitiesRedisKey)

  await continueAsNew<typeof populateActivityRelations>({
    batchSizePerRun: args.batchSizePerRun,
    lastIndexedActivityId,
  })
}
