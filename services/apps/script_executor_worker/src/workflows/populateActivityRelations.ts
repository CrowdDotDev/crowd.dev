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

  const latestSyncedActivityId = await activity.getLatestSyncedActivityId()

  const activitiesToCopy = await activity.getActivitiesToCopy(
    latestSyncedActivityId ?? undefined,
    BATCH_SIZE_PER_RUN,
  )

  if (activitiesToCopy.length === 0) {
    return
  }

  await activity.createRelations(activitiesToCopy)

  await activity.markActivitiesAsIndexed(activitiesToCopy.map((a) => a.id))

  await continueAsNew<typeof populateActivityRelations>({
    batchSizePerRun: args.batchSizePerRun,
  })
}
