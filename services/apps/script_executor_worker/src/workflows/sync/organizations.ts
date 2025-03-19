import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'

import * as entityIndexActivities from '../../activities/sync/entity-index'
import * as orgSyncActivities from '../../activities/sync/organization'
import { ISyncArgs } from '../../types'

const orgSyncActivity = proxyActivities<typeof orgSyncActivities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

const entityIndexActivity = proxyActivities<typeof entityIndexActivities>({
  startToCloseTimeout: '10 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function syncOrganizations(args: ISyncArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100
  const WITH_AGGS = args.withAggs ?? true

  if (args.clean) {
    await entityIndexActivity.deleteIndexedEntities(IndexedEntityType.ORGANIZATION)
    console.log('Deleted indexed entities for organizations!')
  }

  const organizationIds = await orgSyncActivity.getOrganizationsForSync(BATCH_SIZE)

  if (organizationIds.length === 0) {
    console.log('No more organizations to sync!')
    return
  }

  const batchStartTime = new Date()
  const { organizationCount } = await orgSyncActivity.syncOrganizationsBatch(
    organizationIds,
    WITH_AGGS,
    args.chunkSize,
  )

  const diffInSeconds = (new Date().getTime() - batchStartTime.getTime()) / 1000

  console.log(
    `Synced ${organizationCount} organizations! Speed: ${Math.round(
      organizationCount / diffInSeconds,
    )} organizations/second!`,
  )

  await entityIndexActivity.markEntitiesIndexed(IndexedEntityType.ORGANIZATION, organizationIds)

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof syncOrganizations>(args)
}
