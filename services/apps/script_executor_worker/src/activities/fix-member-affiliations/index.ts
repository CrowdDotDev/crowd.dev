import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'

import { svc } from '../../main'

export async function getMemberIdsWithDeletedWorkexperiences(
  tenantId: string,
  limit: number,
  offset: number,
) {
  let rows: string[] = []

  try {
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
    rows = await memberRepo.getMemberIdsWithDeletedWorkexperience(tenantId, limit, offset)
  } catch (err) {
    throw new Error(err)
  }

  return rows
}
