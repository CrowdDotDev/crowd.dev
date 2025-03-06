import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { EntityType } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'

import * as cleanupHelpers from '../../activities/cleanup/helpers'
import * as activities from '../../activities/cleanup/organization'
import { ICleanupArgs } from '../../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

const cleanupHelper = proxyActivities<typeof cleanupHelpers>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function cleanupOrganizations(args: ICleanupArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100

  const organizationIds = await activity.getOrganizationsToCleanup(BATCH_SIZE)

  if (organizationIds.length === 0) {
    console.log('No more organizations to cleanup!')
    return
  }

  const CHUNK_SIZE = 10

  for (let i = 0; i < organizationIds.length; i += CHUNK_SIZE) {
    const chunk = organizationIds.slice(i, i + CHUNK_SIZE)

    const cleanupTasks = chunk.map(async (orgId) => {
      const isInQuestDb = await cleanupHelper.hasActivityRecords(orgId, EntityType.ORGANIZATION)

      if (isInQuestDb) {
        console.log(`Organization ${orgId} is in QuestDB, skipping!`)
        return cleanupHelper.excludeEntityFromCleanup(orgId, EntityType.ORGANIZATION)
      }

      console.log(`Deleting organization ${orgId} from database!`)

      await activity.deleteOrganization(orgId)
      return activity.queueOrgForAggComputation(orgId)
    })

    await Promise.all(cleanupTasks)
  }

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof cleanupOrganizations>(args)
}
