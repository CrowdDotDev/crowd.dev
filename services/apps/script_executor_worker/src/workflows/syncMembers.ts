import { proxyActivities } from '@temporalio/workflow'

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

  console.log(`Starting members sync! (batchSize: ${BATCH_SIZE}, withAggs: ${WITH_AGGS})`)

  if (args.clean) {
    await activity.deleteIndexedEntities(IndexedEntityType.MEMBER)
    console.log('Deleted indexed entities for members!')
  }

  let totalMembersSynced = 0
  let totalDocumentsIndexed = 0

  let memberIds = await activity.getMembersForSync(BATCH_SIZE)

  while (memberIds.length > 0) {
    const batchStartTime = Date.now()
    const { docCount, memberCount } = await activity.syncMembersBatch(
      memberIds,
      WITH_AGGS,
      args.chunkSize,
    )

    totalMembersSynced += memberCount
    totalDocumentsIndexed += docCount

    const speed = Math.round(memberCount / ((Date.now() - batchStartTime) / 60000))

    console.log(`Synced ${memberCount} members! Speed: ${speed} members/minute!`)

    await activity.markEntitiesIndexed(IndexedEntityType.MEMBER, memberIds)

    if (args.testRun) {
      console.log('Test run completed - stopping after first batch!')
      break
    }

    memberIds = await activity.getMembersForSync(BATCH_SIZE)
  }

  console.log(
    `Synced total of ${totalMembersSynced} members with ${totalDocumentsIndexed} documents!`,
  )
}
