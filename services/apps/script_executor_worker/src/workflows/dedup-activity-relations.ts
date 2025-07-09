import { ApplicationFailure, continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IDedupActivityRelationsArgs } from '../types'
import { chunkArray } from '../utils/common'

const {
  getActivityRelationsDuplicateGroups,
  deleteActivityRelations,
  checkActivitiesWithTimestampExistInQuestDb,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function dedupActivityRelations(args: IDedupActivityRelationsArgs): Promise<void> {
  const GROUPS_PER_RUN = args.groupsPerRun || 10

  // 1. Get a batch of duplicate groups
  const duplicateGroups = await getActivityRelationsDuplicateGroups(GROUPS_PER_RUN)

  if (duplicateGroups.length === 0) {
    console.log('No more duplicate groups found!')
    return
  }

  // 2. Create a processing promise for each group
  const processDuplicateGroups = duplicateGroups.map(async (group) => {
    // The first ID in the array is the original
    const activityIdsInGroup = group.activityIds
    const idToKeepIfConfirmed = activityIdsInGroup[0]
    const groupTimestamp = group.timestamp

    console.log(`Expected original activityId: ${idToKeepIfConfirmed}`)

    const activityIdChunks = chunkArray(activityIdsInGroup, 500)
    const activityIdsInQuestDb: string[] = []

    // Check activities in QuestDB
    for (const chunk of activityIdChunks) {
      const foundIds = await checkActivitiesWithTimestampExistInQuestDb(chunk, groupTimestamp)
      activityIdsInQuestDb.push(...foundIds)
    }

    // Validate and prepare for deletion
    if (activityIdsInQuestDb.length === 1) {
      const idFromQuestDb = activityIdsInQuestDb[0]

      if (idFromQuestDb !== idToKeepIfConfirmed) {
        console.log(
          `QuestDB returned a different activityId (${idFromQuestDb}) than the expected (${idToKeepIfConfirmed})`,
        )
      }

      const idsToDelete = activityIdsInGroup.filter((id) => id !== idFromQuestDb)
      if (idsToDelete.length > 0) {
        await deleteActivityRelations(idsToDelete)
      }
    } else {
      throw ApplicationFailure.nonRetryable(
        `Expected 1 activity in QuestDB for group, but found ${activityIdsInQuestDb.length}.`,
      )
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

  await continueAsNew<typeof dedupActivityRelations>(args)
}
