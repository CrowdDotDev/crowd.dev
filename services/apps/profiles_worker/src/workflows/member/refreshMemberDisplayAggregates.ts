import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { IRefreshDisplayAggregatesArgs } from '../../types/common'

const {
  getLastMemberDisplayAggsSyncedAt,
  touchLastMemberDisplayAggsSyncedAt,
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
    lastSyncedAt = await getLastMemberDisplayAggsSyncedAt()
  }

  // todo:nathan rm this after testing
  console.log('lastSyncedAt', lastSyncedAt)

  const result = await getMembersForDisplayAggsRefresh(BATCH_SIZE, lastSyncedAt, lastUuid)

  if (result.length === 0) {
    await touchLastMemberDisplayAggsSyncedAt()
    return
  }

  const lastRow = result[result.length - 1]

  for (const member of result) {
    const memberDisplayAggregates = await getMemberDisplayAggregates(member.entity_id)
    // todo:nathan test the changes with console log and testRun
    console.log('memberDisplayAggregates', JSON.stringify(memberDisplayAggregates, null, 2))
    await setMemberDisplayAggregates(memberDisplayAggregates)
  }

  await continueAsNew<typeof refreshMemberDisplayAggregates>({
    lastUuid: lastRow.entity_id,
    lastSyncedAt: lastRow.indexed_at,
  })
}
