import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'
import { IDuplicateMembersToMerge } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'

import { svc } from '../../main'

export async function findDuplicateMembersAfterDate(
  cutoffDate: string,
  limit: number,
): Promise<IDuplicateMembersToMerge[]> {
  try {
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)

    return memberRepo.findDuplicateMembersAfterDate(cutoffDate, limit)
  } catch (error) {
    svc.log.error(error, 'Error finding duplicate members after cutoff date!')
    throw error
  }
}
