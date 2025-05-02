import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { IScriptBatchTestArgs } from '../../types'
import { chunkArray } from '../../utils/common'

const { getOrganizationsToCleanup, deleteOrganization, syncRemoveOrganization } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function cleanupOrganizations(args: IScriptBatchTestArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100

  const organizationIds = await getOrganizationsToCleanup(BATCH_SIZE)

  if (organizationIds.length === 0) {
    console.log('No more organizations to cleanup!')
    return
  }

  const CHUNK_SIZE = 25

  for (const chunk of chunkArray(organizationIds, CHUNK_SIZE)) {
    const cleanupTasks = chunk.map(async (orgId) => {
      await syncRemoveOrganization(orgId)
      return deleteOrganization(orgId)
    })

    await Promise.all(cleanupTasks).catch((err) => {
      console.error('Error cleaning up organizations!', err)
    })
  }

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof cleanupOrganizations>(args)
}
