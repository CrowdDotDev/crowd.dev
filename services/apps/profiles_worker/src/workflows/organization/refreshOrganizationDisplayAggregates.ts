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

  // todo:nathan rm this after testing
  console.log('lastSyncedAt', lastSyncedAt)

  const result = await getOrganizationsForDisplayAggsRefresh(BATCH_SIZE, lastSyncedAt, lastUuid)

  if (result.length === 0) {
    await touchOrganizationDisplayAggsLastSyncedAt()
    return
  }

  const lastRow = result[result.length - 1]

  for (const organization of result) {
    const organizationDisplayAggregates = await getOrganizationDisplayAggregates(
      organization.entity_id,
    )
    // todo:nathan test the changes with console log and testRun
    console.log(
      'organizationDisplayAggregates',
      JSON.stringify(organizationDisplayAggregates, null, 2),
    )
    await setOrganizationDisplayAggregates(organizationDisplayAggregates)
  }

  await continueAsNew<typeof refreshOrganizationDisplayAggregates>({
    lastUuid: lastRow.entity_id,
    lastSyncedAt: lastRow.indexed_at,
  })
}
