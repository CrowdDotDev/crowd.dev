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
  if (args.deleteIndexedEntities) {
    await activity.deleteActivityIdsFromIndexedEntities()
  }

  // 1- Get latest synced activity id from indexed_entities
  // select max(activity_id) from indexed_entities where tenant_id = 'tenant_id' and entity_type = 'activity'
  const latestSyncedActivityId = await activity.getLatestSyncedActivityId()

  // 2- Get all activities from questdb with id > latest synced activity id, order by activity_id asc, limit 1000
  const activitiesToCopy = await activity.getActivitiesToCopy(
    latestSyncedActivityId ?? undefined,
    100,
  )

  if (activitiesToCopy.length === 0) {
    return
  }

  // 4- Send activities to tinybird
  await activity.sendActivitiesToTinybird(activitiesToCopy)

  // 5- Mark activities as indexed
  await activity.markActivitiesAsIndexed(activitiesToCopy.map((a) => a.id))

  // await continueAsNew<typeof copyActivitiesFromQuestdbToTinybird>({})
}
