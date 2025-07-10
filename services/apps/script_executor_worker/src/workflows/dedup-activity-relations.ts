import { ApplicationFailure, continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IDedupActivityRelationsArgs } from '../types'
import { chunkArray } from '../utils/common'

const {
  getActivityRelationsDuplicateGroups,
  deleteActivityRelations,
  checkActivitiesWithTimestampExistInQuestDb,
  getMissingActivityInQuestDb,
  saveMissingActivityInQuestDb,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function dedupActivityRelations(args: IDedupActivityRelationsArgs): Promise<void> {
  const GROUPS_PER_RUN = args.groupsPerRun || 10

  // 1. Get a batch of duplicate groups
  const duplicateGroups = await getActivityRelationsDuplicateGroups(GROUPS_PER_RUN, args.cursor)

  if (duplicateGroups.length === 0) {
    console.log('No more duplicate groups found!')

    const missingActivityInQuestDb = await getMissingActivityInQuestDb()
    const count = missingActivityInQuestDb.length

    if (count > 0) {
      console.log(`${count} activities are in relations but missing in QuestDB.`)
    }

    return
  }

  // 2. Create a processing promise for each group
  const processDuplicateGroups = duplicateGroups.map(async (group) => {
    // The first ID in the array is the original
    const activityIdsInGroup = group.activityIds
    const latestActivityIdInRelation = activityIdsInGroup[0]
    const groupTimestamp = group.timestamp

    const activityIdChunks = chunkArray(activityIdsInGroup, 500)
    const activityIdsInQuestDb: string[] = []

    // Check activities in QuestDB
    for (const chunk of activityIdChunks) {
      const foundIds = await checkActivitiesWithTimestampExistInQuestDb(chunk, groupTimestamp)
      activityIdsInQuestDb.push(...foundIds)
    }

    let idToKeep: string

    // Validate and prepare for deletion
    if (activityIdsInQuestDb.length > 1) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { activityIds, ...rest } = group
      console.log('QuestDB returned more than 1 activity for group', rest)
      throw ApplicationFailure.nonRetryable(
        `Expected 0 or 1 activity in QuestDB for group, but found ${activityIdsInQuestDb.length}.`,
      )
    } else if (activityIdsInQuestDb.length === 1) {
      // always prefer the activity record from QuestDB
      idToKeep = activityIdsInQuestDb[0]
    } else {
      // activity not found in QuestDB, trust latest in relation as fallback
      idToKeep = latestActivityIdInRelation
      console.log(`No activity found in QuestDB for group, keeping the latest activity in relation`)

      // Record the missing activity in Redis for future investigation
      await saveMissingActivityInQuestDb(latestActivityIdInRelation)
    }

    const idsToDelete = activityIdsInGroup.filter((id) => id !== idToKeep)
    if (idsToDelete.length > 0) {
      await deleteActivityRelations(idsToDelete)
    }
  })

  // 3. Run in parallel
  const results = await Promise.allSettled(processDuplicateGroups)

  // 4. Check the results, collect failures and throw if any
  const failedGroups = results.filter((result) => result.status === 'rejected')

  if (failedGroups.length > 0) {
    const errorMessages = failedGroups
      .map((failure) => (failure.reason as Error).message)
      .join('; ')

    throw ApplicationFailure.nonRetryable(
      `${failedGroups.length} out of ${duplicateGroups.length} groups failed: [${errorMessages}]`,
    )
  }

  if (args.testRun) {
    console.log(`Test run completed!`)
    return
  }

  const nextCursor = duplicateGroups[duplicateGroups.length - 1]

  await continueAsNew<typeof dedupActivityRelations>({
    ...args,
    cursor: nextCursor,
  })
}
