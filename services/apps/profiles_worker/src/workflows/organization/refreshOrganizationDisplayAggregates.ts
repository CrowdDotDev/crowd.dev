import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { IRefreshDisplayAggregatesArgs } from '../../types/common'

const {
  getLastOrganizationDisplayAggsSyncedAt,
  touchLastOrganizationDisplayAggsSyncedAt,
  getOrganizationsForDisplayAggsUpdate,
  getOrganizationDisplayAggregates,
  setOrganizationDisplayAggregates,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
})

export async function refreshOrganizationDisplayAggregates(
  args: IRefreshDisplayAggregatesArgs,
): Promise<void> {
  const BATCH_SIZE = 250

  let lastUuid: string = args.lastUuid ?? null
  let lastSyncedAt: string = args.lastSyncedAt ?? null

  if (!lastSyncedAt) {
    lastSyncedAt = await getLastOrganizationDisplayAggsSyncedAt()
  }

  const organizationIds = await getOrganizationsForDisplayAggsUpdate(
    BATCH_SIZE,
    lastSyncedAt,
    lastUuid,
  )

  if (organizationIds.length === 0) {
    await touchLastOrganizationDisplayAggsSyncedAt()
    return
  }

  lastUuid = organizationIds[organizationIds.length - 1]

  for (const organizationId of organizationIds) {
    const organizationDisplayAggregates = await getOrganizationDisplayAggregates(organizationId)
    await setOrganizationDisplayAggregates(organizationDisplayAggregates)
  }

  await continueAsNew<typeof refreshOrganizationDisplayAggregates>({ lastSyncedAt, lastUuid })
}
