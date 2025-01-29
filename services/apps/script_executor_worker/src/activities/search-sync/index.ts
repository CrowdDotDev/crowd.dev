import { DbStore } from '@crowd/data-access-layer/src/database'
import { MemberRepository } from '@crowd/data-access-layer/src/old/apps/search_sync_worker/member.repo'
import { MemberSyncService } from '@crowd/opensearch'

import { svc } from '../../main'

export async function syncMember(memberId: string, withAggs: boolean): Promise<void> {
  try {
    const memberRepo = new MemberRepository(svc.postgres.writer, svc.log)
    const service = new MemberSyncService(
      svc.redis,
      svc.postgres.writer,
      new DbStore(svc.log, svc.questdbSQL),
      svc.opensearch,
      svc.log,
    )

    const results = await memberRepo.checkMembersExist([memberId])
    if (results.length === 0) {
      svc.log.error(`Member ${memberId} not found!`)
      return
    }

    await service.syncMembers(memberId, { withAggs })
  } catch (err) {
    throw new Error(err)
  }
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
