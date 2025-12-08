import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'

import * as activities from '../../activities'
import { ISyncArgs } from '../../types'

const { deleteIndexedEntities, getOrganizationsForSync, syncOrganizationsBatch } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '30 minutes',
})

export async function syncOrganizations(args: ISyncArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100

  console.log('Starting syncOrganizations with args:', { ...args })

  if (args.clean) {
    await deleteIndexedEntities(IndexedEntityType.ORGANIZATION, args.segmentIds)
    console.log('Deleted indexed entities for organizations!')
  }

  const organizationIds = await getOrganizationsForSync(BATCH_SIZE, args.segmentIds)

  if (organizationIds.length === 0) {
    console.log('No more organizations to sync!')
    return
  }

  const batchStartTime = new Date()
  const { organizationCount } = await syncOrganizationsBatch(organizationIds, args.chunkSize)

  const diffInSeconds = (new Date().getTime() - batchStartTime.getTime()) / 1000

  console.log(
    `Synced ${organizationCount} organizations! Speed: ${Math.round(
      organizationCount / diffInSeconds,
    )} organizations/second!`,
  )

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch, but without the clean flag to avoid infinite cleaning
  await continueAsNew<typeof syncOrganizations>({
    ...args,
    clean: false,
  })
}
