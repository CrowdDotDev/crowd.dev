import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'

import * as activities from '../../activities'
import { ISyncArgs } from '../../types'

const { deleteIndexedEntities, markEntitiesIndexed, getMembersForSync, syncMembersBatch } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '30 minutes',
  })

export async function syncMembers(args: ISyncArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100
  const WITH_AGGS = args.withAggs ?? true

  console.log('Starting syncMembers with args:', { ...args })

  if (args.clean) {
    await deleteIndexedEntities(IndexedEntityType.MEMBER, args.segmentIds)
    console.log('Deleted indexed entities for members!')
  }

  const memberIds = await getMembersForSync(BATCH_SIZE, args.segmentIds)

  if (memberIds.length === 0) {
    console.log('No more members to sync!')
    return
  }

  const batchStartTime = new Date()
  const { memberCount } = await syncMembersBatch(memberIds, WITH_AGGS, args.chunkSize)

  const diffInSeconds = (new Date().getTime() - batchStartTime.getTime()) / 1000

  console.log(
    `Synced ${memberCount} members! Speed: ${Math.round(memberCount / diffInSeconds)} members/second!`,
  )

  await markEntitiesIndexed(IndexedEntityType.MEMBER, memberIds)

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof syncMembers>(args)
}
