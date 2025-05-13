import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { IRefreshDisplayAggregatesArgs } from '../../types/common'

const {
  getMemberDisplayAggsLastSyncedAt,
  touchMemberDisplayAggsLastSyncedAt,
  getMembersForDisplayAggsRefresh,
  getMemberDisplayAggregates,
  setMemberDisplayAggregates,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
})

export async function refreshMemberDisplayAggregates(
  args: IRefreshDisplayAggregatesArgs,
): Promise<void> {
  const BATCH_SIZE = 250

  const lastUuid: string = args.lastUuid ?? null
  let lastSyncedAt: string = args.lastSyncedAt ?? null

  if (!lastSyncedAt) {
    lastSyncedAt = await getMemberDisplayAggsLastSyncedAt()
  }

  const result = await getMembersForDisplayAggsRefresh(BATCH_SIZE, lastSyncedAt, lastUuid)

  if (result.length === 0) {
    await touchMemberDisplayAggsLastSyncedAt()
    return
  }

  const lastRow = result[result.length - 1]

  for (const member of result) {
    const memberDisplayAggs = await getMemberDisplayAggregates(member.entity_id)
    if (memberDisplayAggs.length > 0) {
      await setMemberDisplayAggregates(memberDisplayAggs)
    }
  }

  await continueAsNew<typeof refreshMemberDisplayAggregates>({
    lastUuid: lastRow.entity_id,
    lastSyncedAt: lastRow.indexed_at,
  })
}
