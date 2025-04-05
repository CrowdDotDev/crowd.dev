import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { EntityType } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'

import * as activities from '../activities'
import { IFixActivityForiegnKeysArgs } from '../types'

const {
  findMergeActionsWithDeletedSecondaryEntities,
  doesActivityExistInQuestDb,
  moveActivitiesToCorrectEntity,
  syncMembersBatch,
  queueOrgForAggComputation,
  calculateMemberAffiliations,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '45 minutes',
})

export async function fixActivityForiegnKeys(args: IFixActivityForiegnKeysArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100
  const OFFSET = args.offset ?? 0

  const entityType = args.entityType as EntityType

  console.log(`Fixing ${args.entityType}s with offset ${OFFSET} and batch size ${BATCH_SIZE}`)

  const mergeActions = await findMergeActionsWithDeletedSecondaryEntities(
    BATCH_SIZE,
    OFFSET,
    entityType,
  )

  if (mergeActions.length === 0) {
    console.log(`No more ${args.entityType}s to fix!`)
    return
  }

  const CHUNK_SIZE = 30

  for (let i = 0; i < mergeActions.length; i += CHUNK_SIZE) {
    const chunk = mergeActions.slice(i, i + CHUNK_SIZE)

    const tasks = chunk.map(async (mergeAction) => {
      const isInQuestDb = await doesActivityExistInQuestDb(mergeAction.secondaryId, entityType)

      if (!isInQuestDb) {
        console.log(`${args.entityType} ${mergeAction.secondaryId} not in QuestDB, skipping!`)
        return
      }

      await moveActivitiesToCorrectEntity(
        mergeAction.secondaryId,
        mergeAction.primaryId,
        entityType,
      )

      if (entityType === EntityType.MEMBER) {
        await calculateMemberAffiliations(mergeAction.primaryId)
        return syncMembersBatch([mergeAction.primaryId], true)
      }

      if (entityType === EntityType.ORGANIZATION) {
        console.log(`Queueing org ${mergeAction.primaryId} for agg computation`)
        return queueOrgForAggComputation(mergeAction.primaryId)
      }
    })

    await Promise.all(tasks)
  }

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof fixActivityForiegnKeys>({
    ...args,
    offset: Number(OFFSET) + Number(BATCH_SIZE),
  })
}
