import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'

import * as entityIndexActivities from '../../activities/sync/entity-index'
import * as memberSyncActivities from '../../activities/sync/member'
import { ISyncArgs } from '../../types'

const memberSyncActivity = proxyActivities<typeof memberSyncActivities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

const entityIndexActivity = proxyActivities<typeof entityIndexActivities>({
  startToCloseTimeout: '10 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function syncMembers(args: ISyncArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100
  const WITH_AGGS = args.withAggs ?? true

  console.log('Starting syncMembers with args:', { ...args })

  if (args.clean) {
    await entityIndexActivity.deleteIndexedEntities(IndexedEntityType.MEMBER, args.segmentId)
    console.log(`Deleted indexed entities for members!`)
  }

  const memberIds = await memberSyncActivity.getMembersForSync(BATCH_SIZE, args.segmentId)

  if (memberIds.length === 0) {
    console.log('No more members to sync!')
    return
  }

  const batchStartTime = new Date()
  const { memberCount } = await memberSyncActivity.syncMembersBatch(
    memberIds,
    WITH_AGGS,
    args.chunkSize,
  )

  const diffInSeconds = (new Date().getTime() - batchStartTime.getTime()) / 1000

  console.log(
    `Synced ${memberCount} members! Speed: ${Math.round(memberCount / diffInSeconds)} members/second!`,
  )

  await entityIndexActivity.markEntitiesIndexed(IndexedEntityType.MEMBER, memberIds)

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof syncMembers>(args)
}
