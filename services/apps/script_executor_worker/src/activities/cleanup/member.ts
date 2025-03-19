import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'

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
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
    return memberRepo.deleteMember(memberId)
  } catch (error) {
    svc.log.error(error, 'Error cleaning up member!')
    throw error
  }
}
