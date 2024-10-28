import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'
import { ISimilarMember } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'

import { svc } from '../../main'

export async function findMembersWithSameVerifiedEmailsInDifferentPlatforms(
  tenantId: string,
  limit: number,
  afterHash?: number,
): Promise<ISimilarMember[]> {
  let rows: ISimilarMember[] = []

  try {
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
    rows = await memberRepo.findMembersWithSameVerifiedEmailsInDifferentPlatforms(
      tenantId,
      limit,
      afterHash,
    )
  } catch (err) {
    throw new Error(err)
  }

  return rows
}

export async function findMembersWithSamePlatformIdentitiesDifferentCapitalization(
  tenantId: string,
  platform: string,
  limit: number,
  afterHash?: number,
): Promise<ISimilarMember[]> {
  let rows: ISimilarMember[] = []

  try {
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
    rows = await memberRepo.findMembersWithSameGithubIdentitiesDifferentCapitalization(
      tenantId,
      platform,
      limit,
      afterHash,
    )
  } catch (err) {
    throw new Error(err)
  }

  return rows
}
