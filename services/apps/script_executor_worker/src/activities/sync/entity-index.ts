import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'
import { IndexingRepository } from '@crowd/opensearch/src/repo/indexing.repo'

import { svc } from '../../main'

export async function deleteIndexedEntities(entityType: IndexedEntityType): Promise<void> {
  try {
    const indexingRepo = new IndexingRepository(svc.postgres.writer, svc.log)
    await indexingRepo.deleteIndexedEntities(entityType)
  } catch (error) {
    svc.log.error(error, 'Error deleting indexed entities')
    throw error
  }
}

export async function markEntitiesIndexed(
  entityType: IndexedEntityType,
  entityIds: string[],
): Promise<void> {
  try {
    const indexingRepo = new IndexingRepository(svc.postgres.writer, svc.log)
    await indexingRepo.markEntitiesIndexed(entityType, entityIds)
  } catch (error) {
    svc.log.error(error, 'Error marking entities indexed')
    throw error
  }
}
