import { DbStore } from '@crowd/data-access-layer/src/database'
import { MemberSyncService } from '@crowd/opensearch'
import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'
import { IndexingRepository } from '@crowd/opensearch/src/repo/indexing.repo'

import { svc } from '../main'

export async function deleteIndexedEntities(): Promise<void> {
  const indexingRepo = new IndexingRepository(svc.postgres.writer, svc.log)
  await indexingRepo.deleteIndexedEntities(IndexedEntityType.MEMBER)
}

export async function syncAllMembers(batchSize: number, withAggs: boolean): Promise<void> {
  try {
    const service = new MemberSyncService(
      svc.redis,
      svc.postgres.writer,
      new DbStore(svc.log, svc.questdbSQL),
      svc.opensearch,
      svc.log,
    )
    await service.syncAllMembers(batchSize, { withAggs })
  } catch (err) {
    throw new Error(err)
  }
}
