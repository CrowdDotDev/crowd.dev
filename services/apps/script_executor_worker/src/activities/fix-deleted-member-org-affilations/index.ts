import { runMemberAffiliationsUpdate } from '@crowd/data-access-layer/src/old/apps/profiles_worker'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'
import TempRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/temp.repo'

import { svc } from '../../main'

export async function getMembersWithDeletedOrgAffilations(
  limit: number,
): Promise<{ memberId: string; organizationId: string }[]> {
  try {
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
    return memberRepo.getMembersWithDeletedOrgAffilations(limit)
  } catch (err) {
    throw new Error(err)
  }
}

export async function calculateMemberAffiliations(memberId: string): Promise<void> {
  try {
    await runMemberAffiliationsUpdate(svc.postgres.writer, svc.questdbSQL, svc.queue, memberId)
  } catch (err) {
    throw new Error(err)
  }
}

export async function markMemberOrgAffiliationAsProcessed(
  memberId: string,
  organizationId: string,
): Promise<void> {
  const repo = new TempRepository(svc.postgres.writer.connection())
  await repo.markMemberOrgAffiliationAsProcessed(memberId, organizationId)
}

export async function getProcessedMemberOrgAffiliations(
  limit: number,
): Promise<{ memberId: string; organizationId: string }[]> {
  const repo = new TempRepository(svc.postgres.writer.connection())
  return repo.getProcessedMemberOrgAffiliations(limit)
}

export async function deleteProcessedMemberOrgAffiliations(
  memberId: string,
  organizationId: string,
): Promise<void> {
  const repo = new TempRepository(svc.postgres.writer.connection())
  await repo.deleteProcessedMemberOrgAffiliations(memberId, organizationId)
}
