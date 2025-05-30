import {
  fetchMemberDisplayAggregates,
  updateMemberDisplayAggregates,
} from '@crowd/data-access-layer'
import { getSystemSettingValue, setSystemSettingValue } from '@crowd/data-access-layer'
import { IMemberSegmentDisplayAggregates } from '@crowd/data-access-layer/src/members/types'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { IRecentlyIndexedEntity, IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'
import { IndexingRepository } from '@crowd/opensearch/src/repo/indexing.repo'

import { svc } from '../../main'

export async function getMemberDisplayAggsLastSyncedAt(): Promise<string | null> {
  const qx = pgpQx(svc.postgres.reader.connection())
  const setting = await getSystemSettingValue(qx, 'memberDisplayAggsLastSyncedAt')

  if (!setting) {
    throw new Error('Member display aggs last sync at setting not found!')
  }

  return setting.timestamp
}

export async function touchMemberDisplayAggsLastSyncedAt(): Promise<void> {
  const qx = pgpQx(svc.postgres.writer.connection())
  await setSystemSettingValue(qx, 'memberDisplayAggsLastSyncedAt', {
    timestamp: new Date().toISOString(),
  })
}

export async function getMembersForDisplayAggsRefresh(
  batchSize: number,
  lastSyncedAt: string,
  afterMemberId?: string,
): Promise<IRecentlyIndexedEntity[]> {
  const indexingRepo = new IndexingRepository(svc.postgres.reader, svc.log)
  return indexingRepo.getRecentlyIndexedEntities(
    IndexedEntityType.MEMBER,
    batchSize,
    lastSyncedAt,
    afterMemberId,
  )
}

export async function getMemberDisplayAggregates(
  memberId: string,
): Promise<IMemberSegmentDisplayAggregates[]> {
  return fetchMemberDisplayAggregates(svc.questdbSQL, memberId)
}

export async function setMemberDisplayAggregates(
  data: IMemberSegmentDisplayAggregates[],
): Promise<void> {
  const qx = pgpQx(svc.postgres.writer.connection())
  await updateMemberDisplayAggregates(qx, data)
}
