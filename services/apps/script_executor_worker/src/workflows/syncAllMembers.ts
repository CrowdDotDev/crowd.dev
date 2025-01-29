import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/member-sync'
import { ISyncMembersArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minute',
  retry: { maximumAttempts: 3 },
})

export async function syncAllMembers(args: ISyncMembersArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize || 500
  const WITH_AGGS = args.withAggs || true

  console.log('Starting members sync!')

  if (args.clean) {
    await activity.deleteIndexedEntities()
    console.log('Deleted indexed entities for members!')
  }

  await activity.syncAllMembers(BATCH_SIZE, WITH_AGGS)
  console.log(`Successfully synced all members`)
}
