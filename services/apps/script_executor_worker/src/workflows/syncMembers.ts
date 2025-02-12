import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'

import * as activities from '../activities/sync/member'
import { ISyncMembersArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minute',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function syncMembers(args: ISyncMembersArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize || 100
  const WITH_AGGS = args.withAggs || true

  if (args.clean) {
    await activity.deleteIndexedEntities(IndexedEntityType.MEMBER)
    console.log('Deleted indexed entities for members!')
  }

  const memberIds = await activity.getMembersForSync(BATCH_SIZE)

  if (memberIds.length === 0) {
    console.log('No more members to sync!')
    return
  }

  const batchStartTime = new Date()
  const { memberCount } = await activity.syncMembersBatch(memberIds, WITH_AGGS, args.chunkSize)

  const diffInSeconds = (new Date().getTime() - batchStartTime.getTime()) / 1000

  console.log(
    `Synced ${memberCount} members! Speed: ${Math.round(memberCount / diffInSeconds)} members/second!`,
  )

  await activity.markEntitiesIndexed(IndexedEntityType.MEMBER, memberIds)

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof syncMembers>(args)
}
