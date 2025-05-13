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
  startToCloseTimeout: '30 minutes',
})

export async function refreshOrganizationDisplayAggregates(
  args: IRefreshDisplayAggregatesArgs,
): Promise<void> {
  const BATCH_SIZE = 250

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
