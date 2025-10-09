import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'
import { MemberSyncService } from '@crowd/opensearch'

import { svc } from '../../main'

export async function getMembersToCleanup(batchSize: number): Promise<string[]> {
  try {
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
    return memberRepo.getMembersForCleanup(batchSize)
  } catch (error) {
    svc.log.error(error, 'Error getting members for cleanup!')
    throw error
  }
}

export async function deleteMember(memberId: string): Promise<void> {
  try {
    const memberRepo = new MemberRepository(svc.postgres.writer.connection(), svc.log)
    return memberRepo.deleteMember(memberId)
  } catch (error) {
    svc.log.error(error, 'Error cleaning up member in database!')
    throw error
  }
}

export async function syncRemoveMember(memberId: string): Promise<void> {
  try {
    const service = new MemberSyncService(svc.redis, svc.postgres.writer, svc.opensearch, svc.log)
    await service.removeMember(memberId)
  } catch (error) {
    svc.log.error(error, 'Error removing member in opensearch!')
    throw error
  }
}
