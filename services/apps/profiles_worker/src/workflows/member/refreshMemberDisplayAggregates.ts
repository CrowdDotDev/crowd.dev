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
  startToCloseTimeout: '45 minutes',
})

/*
  Async Temporal workflow to refresh member display aggregates daily.

  Two-Tier Aggregation Strategy:

  - Core Aggregates: Real-time, lightweight metrics from the Postgres 
    activityRelations table, calculated synchronously in syncMember:
      - activeOn
      - activityCount

  - Display Aggregates: UI-facing analytics from the postgres activityRelations 
    table, calculated asynchronously in this workflow:
      - averageSentiment
      - activeOn (historical)
      - activityTypes

  This workflow processes recently indexed members via the indexed_entities 
  table and a memberDisplayAggsLastSyncedAt watermark. It updates the 
  memberSegmentsAgg table and advances the watermark.
*/
export async function refreshMemberDisplayAggregates(
  args: IRefreshDisplayAggregatesArgs,
): Promise<void> {
  const BATCH_SIZE = 100

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
