import { ApplicationFailure, continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IDedupActivityRelationsArgs } from '../types'
import { chunkArray } from '../utils/common'

const {
  getActivityRelationsDuplicateGroup,
  deleteActivityRelations,
  checkActivitiesWithTimestampExistInQuestDb,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function dedupActivityRelations(args: IDedupActivityRelationsArgs): Promise<void> {
  const GROUPS_PER_RUN = args.groupsPerRun || 10
  let groupsProcessed = 0

  while (groupsProcessed < GROUPS_PER_RUN) {
    // 1. Get all rows for a single duplicate group, sorted with the latest first.
    const duplicateGroup = await getActivityRelationsDuplicateGroup()

    if (duplicateGroup.length === 0) {
      console.log('No more duplicate groups found!')
      return
    }

    // 2. The first item is the "original"
    const ogActivityId = duplicateGroup[0].activityId
    const ogActivityTimestamp = duplicateGroup[0].timestamp

    console.log(`Expected original activityId (${ogActivityId})`)

    const activityIds = duplicateGroup.map(({ activityId }) => activityId)

    const activityIdChunks = chunkArray(activityIds, 500)
    const activityIdsInQuestDb: string[] = []

    // 3. Check activities in QuestDB in chunks
    for (const chunk of activityIdChunks) {
      const foundIds = await checkActivitiesWithTimestampExistInQuestDb(chunk, ogActivityTimestamp)

      if (foundIds.length > 0) {
        activityIdsInQuestDb.push(...foundIds)
      }
    }

    if (activityIdsInQuestDb.length === 1) {
      const idToKeep = activityIdsInQuestDb[0]

      if (idToKeep === ogActivityId) {
        console.log(`QuestDB returned the expected activityId`)
      } else {
        console.log(
          `QuestDB returned a different activityId (${idToKeep}) than the expected activityId (${ogActivityId})`,
        )
      }

      const idsToDelete = duplicateGroup
        .map(({ activityId }) => activityId)
        .filter((id) => id !== idToKeep)

      if (idsToDelete.length > 0) {
        await deleteActivityRelations(idsToDelete)
      }
    } else {
      throw ApplicationFailure.nonRetryable(
        `Expected only one activity in QuestDB but found ${activityIdsInQuestDb.length} activities.`,
      )
    }

    groupsProcessed++
  }

  if (args.testRun) {
    console.log('Test run completed!')
    return
  }

  await continueAsNew<typeof dedupActivityRelations>(args)
}
