import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/search-sync'
import { ISyncMembersArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 hour',
  retry: { maximumAttempts: 3 },
})

export async function syncMembers(args: ISyncMembersArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize || 500
  const WITH_AGGS = args.withAggs || true

  console.log('Starting members sync!')

  if (args.memberIds.length) {
    for (const memberId of args.memberIds) {
      await activity.syncMember(memberId, WITH_AGGS)
    }
    console.log(`Successfully synced ${args.memberIds.length} members`)
  } else {
    await activity.syncAllMembers(BATCH_SIZE, WITH_AGGS)
    console.log(`Successfully synced all members`)
  }
}
