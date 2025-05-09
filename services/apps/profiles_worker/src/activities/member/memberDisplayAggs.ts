import {
  fetchMemberDisplayAggregates,
  updateMemberDisplayAggregates,
} from '@crowd/data-access-layer'
import { IMemberSegmentDisplayAggregates } from '@crowd/data-access-layer/src/members/types'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import {
  getLastMemberDisplayAggsSyncedAt as getLastMemberDisplayAggsSyncedAtOfTenant,
  touchLastMemberDisplayAggsSyncedAt as touchLastMemberDisplayAggsSyncedAtOfTenant,
} from '@crowd/data-access-layer/src/tenantSettings'
import { IRecentlyIndexedEntity, IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'
import { IndexingRepository } from '@crowd/opensearch/src/repo/indexing.repo'

import { svc } from '../../main'

export async function getLastMemberDisplayAggsSyncedAt(): Promise<string> {
  try {
    const qx = pgpQx(svc.postgres.reader.connection())
    return getLastMemberDisplayAggsSyncedAtOfTenant(qx)
  } catch (error) {
    throw new Error(error)
  }
}

export async function touchLastMemberDisplayAggsSyncedAt(): Promise<void> {
  try {
    const qx = pgpQx(svc.postgres.writer.connection())
    await touchLastMemberDisplayAggsSyncedAtOfTenant(qx)
  } catch (error) {
    throw new Error(error)
  }
}

export async function getMembersForDisplayAggsRefresh(
  batchSize: number,
  lastSyncedAt: string,
  afterMemberId?: string,
): Promise<IRecentlyIndexedEntity[]> {
  try {
    const indexingRepo = new IndexingRepository(svc.postgres.reader, svc.log)
    return indexingRepo.getRecentlyIndexedEntities(
      IndexedEntityType.MEMBER,
      batchSize,
      lastSyncedAt,
      afterMemberId,
    )
  } catch (error) {
    throw new Error(error)
  }
}

export async function getMemberDisplayAggregates(
  memberId: string,
): Promise<IMemberSegmentDisplayAggregates[]> {
  try {
    return fetchMemberDisplayAggregates(svc.questdbSQL, memberId)
  } catch (error) {
    throw new Error(error)
  }
}

export async function setMemberDisplayAggregates(
  data: IMemberSegmentDisplayAggregates[],
): Promise<void> {
  try {
    const qx = pgpQx(svc.postgres.writer.connection())
    await updateMemberDisplayAggregates(qx, data)
  } catch (error) {
    throw new Error(error)
  }
}
