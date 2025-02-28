import { runMemberAffiliationsUpdate } from '@crowd/data-access-layer/src/old/apps/profiles_worker'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'

import { svc } from '../../main'

export async function getSegmentMembers(
  segmentId: string,
  limit: number,
  offset: number,
): Promise<string[]> {
  const memberRepo = new MemberRepository(svc.questdbSQL, svc.log)
  return memberRepo.getSegmentMembers(segmentId, limit, offset)
}

export async function calculateMemberAffiliations(memberId: string): Promise<void> {
  try {
    await runMemberAffiliationsUpdate(svc.postgres.writer, svc.questdbSQL, svc.queue, memberId)
  } catch (err) {
    throw new Error(err)
  }
}
