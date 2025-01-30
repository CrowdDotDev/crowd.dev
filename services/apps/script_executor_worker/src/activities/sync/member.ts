import { DbStore } from '@crowd/data-access-layer/src/database'
import { MemberSyncService } from '@crowd/opensearch'
import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'
import { IndexingRepository } from '@crowd/opensearch/src/repo/indexing.repo'
import { MemberRepository } from '@crowd/opensearch/src/repo/member.repo'

import { svc } from '../../main'

export async function deleteIndexedEntities(entityType: IndexedEntityType): Promise<void> {
  const indexingRepo = new IndexingRepository(svc.postgres.writer, svc.log)
  await indexingRepo.deleteIndexedEntities(entityType)
}

export async function markEntitiesIndexed(
  entityType: IndexedEntityType,
  entityIds: string[],
): Promise<void> {
  const indexingRepo = new IndexingRepository(svc.postgres.writer, svc.log)
  await indexingRepo.markEntitiesIndexed(entityType, entityIds)
}

export async function getMembersForSync(batchSize: number): Promise<string[]> {
  const memberRepo = new MemberRepository(svc.redis, svc.postgres.writer, svc.log)
  return memberRepo.getMembersForSync(batchSize)
}

export async function syncMembersBatch(
  memberIds: string[],
  withAggs: boolean,
): Promise<{ docCount: number; memberCount: number }> {
  let docCount = 0
  let memberCount = 0

  try {
    const service = new MemberSyncService(
      svc.redis,
      svc.postgres.writer,
      new DbStore(svc.log, svc.questdbSQL),
      svc.opensearch,
      svc.log,
    )

    for (const memberId of memberIds) {
      const { membersSynced, documentsIndexed } = await service.syncMembers(memberId, {
        withAggs,
      })

      docCount += documentsIndexed
      memberCount += membersSynced
    }

    return {
      docCount,
      memberCount,
    }
  } catch (err) {
    throw new Error(err)
  }
}
