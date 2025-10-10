import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { IRefreshDisplayAggregatesArgs } from '../../types/common'

const {
  getOrganizationDisplayAggsLastSyncedAt,
  touchOrganizationDisplayAggsLastSyncedAt,
  getOrganizationsForDisplayAggsRefresh,
  getOrganizationDisplayAggregates,
  setOrganizationDisplayAggregates,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '45 minutes',
})

/*
  Async Temporal workflow to refresh organization display aggregates daily.

  Two-Tier Aggregation Strategy:

  - Core Aggregates: Real-time, lightweight metrics from Postgres 
    activityRelations table, calculated synchronously in syncOrganization:
    - activeOn
    - activityCount
    - memberCount

  - Display Aggregates: UI-facing analytics from postgres activityRelations 
    table, calculated asynchronously in this workflow:
    - joinedAt
    - lastActive
    - avgContributorEngagement

  This workflow processes recently indexed organizations via indexed_entities 
  and a organizationDisplayAggsLastSyncedAt watermark, updates organizationSegmentsAgg, 
  and advances the watermark.
*/
export async function refreshOrganizationDisplayAggregates(
  args: IRefreshDisplayAggregatesArgs,
): Promise<void> {
  const BATCH_SIZE = 100

  const lastUuid: string = args.lastUuid ?? null
  let lastSyncedAt: string = args.lastSyncedAt ?? null

  if (!lastSyncedAt) {
    lastSyncedAt = await getOrganizationDisplayAggsLastSyncedAt()
  }

  const result = await getOrganizationsForDisplayAggsRefresh(BATCH_SIZE, lastSyncedAt, lastUuid)

  if (result.length === 0) {
    await touchOrganizationDisplayAggsLastSyncedAt()
    return
  }

  const lastRow = result[result.length - 1]

  for (const organization of result) {
    const organizationDisplayAggs = await getOrganizationDisplayAggregates(organization.entity_id)
    if (organizationDisplayAggs.length > 0) {
      await setOrganizationDisplayAggregates(organizationDisplayAggs)
    }
  }

  await continueAsNew<typeof refreshOrganizationDisplayAggregates>({
    lastUuid: lastRow.entity_id,
    lastSyncedAt: lastRow.indexed_at,
  })
}
