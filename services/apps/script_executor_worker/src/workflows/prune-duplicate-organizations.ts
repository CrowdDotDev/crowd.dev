import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IScriptBatchTestArgs } from '../types'
import { chunkArray } from '../utils/common'

const { getOrganizationsToPrune, pruneOrganization, syncRemoveOrganization } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function pruneDuplicateOrganizations(args: IScriptBatchTestArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100

  const organizationsToPrune = await getOrganizationsToPrune(BATCH_SIZE)

  if (organizationsToPrune.length === 0) {
    console.log('No more organizations to prune!')
    return
  }

  const CHUNK_SIZE = 25

  for (const chunk of chunkArray(organizationsToPrune, CHUNK_SIZE)) {
    const cleanupTasks = chunk.map(async (o) => {
      console.log('Pruning organization', o.displayName)
      await syncRemoveOrganization(o.id)
      return pruneOrganization(o.id)
    })

    await Promise.all(cleanupTasks).catch((err) => {
      console.error('Error pruning organizations!', err)
    })
  }
}
