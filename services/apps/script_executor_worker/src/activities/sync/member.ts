import { sumBy } from '@crowd/common'
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
  chunkSize?: number,
): Promise<{ docCount: number; memberCount: number }> {
  const startTime = new Date()
  try {
    const service = new MemberSyncService(
      svc.redis,
      svc.postgres.writer,
      new DbStore(svc.log, svc.questdbSQL),
      svc.opensearch,
      svc.log,
    )

    const CHUNK_SIZE = chunkSize || 10

    svc.log.info(`Syncing members in chunks of ${CHUNK_SIZE} members!`)

    const results = []
    for (let i = 0; i < memberIds.length; i += CHUNK_SIZE) {
      const chunk = memberIds.slice(i, i + CHUNK_SIZE)
      const chunkResults = await Promise.all(
        chunk.map((memberId) => service.syncMembers(memberId, { withAggs })),
      )
      results.push(...chunkResults)
    }

    const totalDiffInMinutes = (new Date().getTime() - startTime.getTime()) / (1000 * 60)
    svc.log.info(
      `Completed sync of ${memberIds.length} members in ${totalDiffInMinutes.toFixed(2)} minutes`,
    )

    return {
      docCount: sumBy(results, (r) => r.documentsIndexed),
      memberCount: sumBy(results, (r) => r.membersSynced),
    }
  } catch (err) {
    throw new Error(err)
  }
}
