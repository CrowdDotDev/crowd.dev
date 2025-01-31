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
  let totalDocCount = 0
  let totalMemberCount = 0

  try {
    const service = new MemberSyncService(
      svc.redis,
      svc.postgres.writer,
      new DbStore(svc.log, svc.questdbSQL),
      svc.opensearch,
      svc.log,
    )

    // Split members into two groups
    const midpoint = Math.floor(memberIds.length / 2)
    const firstHalf = memberIds.slice(0, midpoint)
    const secondHalf = memberIds.slice(midpoint)

    // Process first half sequentially
    svc.log.info(`Processing first ${firstHalf.length} members sequentially...`)
    const sequentialStartTime = Date.now()
    let sequentialDocCount = 0
    let sequentialMemberCount = 0

    for (const memberId of firstHalf) {
      const { membersSynced, documentsIndexed } = await service.syncMembers(memberId, {
        withAggs,
      })
      sequentialDocCount += documentsIndexed
      sequentialMemberCount += membersSynced
    }

    const sequentialEndTime = Date.now()
    const sequentialDuration = (sequentialEndTime - sequentialStartTime) / 1000
    svc.log.info(
      `Sequential processing of ${firstHalf.length} members took ${sequentialDuration.toFixed(2)}s (${(
        sequentialMemberCount / sequentialDuration
      ).toFixed(2)} members/s)`,
    )

    // Process second half in parallel with chunks of 5
    svc.log.info(`Processing second ${secondHalf.length} members in parallel...`)
    const parallelStartTime = Date.now()
    let parallelDocCount = 0
    let parallelMemberCount = 0
    const CHUNK_SIZE = 10

    for (let i = 0; i < secondHalf.length; i += CHUNK_SIZE) {
      const chunk = secondHalf.slice(i, i + CHUNK_SIZE)
      const promises = chunk.map(async (memberId) => {
        const result = await service.syncMembers(memberId, { withAggs })
        return result
      })
      const results = await Promise.all(promises)
      for (const result of results) {
        parallelDocCount += result.documentsIndexed
        parallelMemberCount += result.membersSynced
      }
    }

    const parallelEndTime = Date.now()
    const parallelDuration = (parallelEndTime - parallelStartTime) / 1000
    svc.log.info(
      `Parallel processing of ${secondHalf.length} members took ${parallelDuration.toFixed(2)}s (${(
        parallelMemberCount / parallelDuration
      ).toFixed(2)} members/s)`,
    )

    // Log performance comparison
    const speedupRatio = sequentialDuration / parallelDuration
    svc.log.info(
      `Performance comparison for ${secondHalf.length} members each:
      Sequential: ${sequentialDuration.toFixed(2)}s (${(sequentialMemberCount / sequentialDuration).toFixed(2)} members/s)
      Parallel  : ${parallelDuration.toFixed(2)}s (${(parallelMemberCount / parallelDuration).toFixed(2)} members/s)
      Parallel processing was ${speedupRatio.toFixed(2)}x ${speedupRatio > 1 ? 'faster' : 'slower'}`,
    )

    totalDocCount = sequentialDocCount + parallelDocCount
    totalMemberCount = sequentialMemberCount + parallelMemberCount

    return {
      docCount: totalDocCount,
      memberCount: totalMemberCount,
    }
  } catch (err) {
    throw new Error(err)
  }
}
