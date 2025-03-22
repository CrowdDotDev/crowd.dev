import { sumBy } from '@crowd/common'
import { DbStore } from '@crowd/data-access-layer/src/database'
import { MemberSyncService } from '@crowd/opensearch'
import { MemberRepository } from '@crowd/opensearch/src/repo/member.repo'

import { svc } from '../../main'

export async function getMembersForSync(batchSize: number): Promise<string[]> {
  try {
    const memberRepo = new MemberRepository(svc.redis, svc.postgres.reader, svc.log)
    return memberRepo.getMembersForSync(batchSize)
  } catch (error) {
    svc.log.error(error, 'Error getting members for sync')
    throw error
  }
}

export async function syncMembersBatch(
  memberIds: string[],
  withAggs: boolean,
  chunkSize?: number,
): Promise<{ docCount: number; memberCount: number }> {
  try {
    const service = new MemberSyncService(
      svc.redis,
      svc.postgres.writer,
      new DbStore(svc.log, svc.questdbSQL),
      svc.opensearch,
      svc.log,
    )

    const CHUNK_SIZE = chunkSize || 10

    const results = []
    for (let i = 0; i < memberIds.length; i += CHUNK_SIZE) {
      const chunk = memberIds.slice(i, i + CHUNK_SIZE)
      const chunkResults = await Promise.all(
        chunk.map((memberId) => service.syncMembers(memberId, { withAggs })),
      )
      results.push(...chunkResults)
    }

    return {
      docCount: sumBy(results, (r) => r.documentsIndexed),
      memberCount: sumBy(results, (r) => r.membersSynced),
    }
  } catch (err) {
    throw new Error(err)
  }
}
