import { ApplicationFailure, continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IDedupActivityRelationsArgs } from '../types'
import { chunkArray } from '../utils/common'

const {
  getActivityRelationsDuplicateGroup,
  deleteActivityRelations,
  checkIfActivitiesExistInQuestDb,
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
    const originalActivityRelation = duplicateGroup[0]
    console.log('Original activity relation:', originalActivityRelation)

    const activityIds = duplicateGroup.map(({ activityId }) => activityId)
    const timestamps = duplicateGroup.map((r) => new Date(r.timestamp).getTime())

    // 3. Get the start and end times for the duplicate group to check in QuestDB
    const startTime = new Date(Math.min(...timestamps)).toISOString()
    const endTime = new Date(Math.max(...timestamps)).toISOString()

    const activityIdChunks = chunkArray(activityIds, 500)
    const activityIdsInQuestDb: string[] = []

    // 4. Check activities in QuestDB in chunks
    for (const chunk of activityIdChunks) {
      const foundIds = await checkIfActivitiesExistInQuestDb(chunk, startTime, endTime)

      if (foundIds.length > 0) {
        activityIdsInQuestDb.push(...foundIds)
      }
    }

    if (
      activityIdsInQuestDb.length === 1 &&
      activityIdsInQuestDb[0] === originalActivityRelation.activityId
    ) {
      console.log(`Original activity ${originalActivityRelation.activityId} confirmed in QuestDB.`)
      const idsToDelete = duplicateGroup.slice(1).map(({ activityId }) => activityId)

      if (idsToDelete.length > 0) {
        console.log(`Deleting ${idsToDelete.length} duplicate relations.`)
        await deleteActivityRelations(idsToDelete)
      }
    } else {
      throw new ApplicationFailure(
        `Expected only one activity in QuestDB but found ${activityIdsInQuestDb.length} activities.`,
      )
    }

    groupsProcessed++
  }

  await continueAsNew<typeof dedupActivityRelations>(args)
}
