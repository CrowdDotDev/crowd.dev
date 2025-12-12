import { moveActivityRelationsWithIdentityToAnotherMember, pgpQx } from '@crowd/data-access-layer'
import { IDbActivityRelation } from '@crowd/data-access-layer/src/activityRelations/types'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'

import { svc } from '../main'

export async function findMembersWithWrongActivityRelations(
  platform: string,
  batchSize: number,
): Promise<Partial<IDbActivityRelation>[]> {
  try {
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
    const records = await memberRepo.findMembersWithIncorrectActivityRelations(platform, batchSize)

    // Deduplicate by (memberId, username, platform)
    const seen = new Set<string>()
    const uniqueRecords: Partial<IDbActivityRelation>[] = []

    for (const record of records) {
      const key = `${record.memberId}:${record.username}:${record.platform}`

      if (!seen.has(key)) {
        seen.add(key)
        uniqueRecords.push(record)
      }
    }

    return uniqueRecords
  } catch (error) {
    svc.log.error(error, 'Error finding activity relations with wrong member id!')
    throw error
  }
}

export async function findMemberIdByUsernameAndPlatform(
  username: string,
  platform: string,
): Promise<string> {
  try {
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
    return memberRepo.getMemberIdByUsernameAndPlatform(username, platform)
  } catch (error) {
    svc.log.error(
      { error, username, platform },
      'Error getting member id by username and platform!',
    )
    throw error
  }
}

export async function moveActivityRelations(
  fromId: string,
  toId: string,
  username: string,
  platform: string,
): Promise<void> {
  try {
    const qx = pgpQx(svc.postgres.writer.connection())
    await moveActivityRelationsWithIdentityToAnotherMember(qx, fromId, toId, username, platform)
  } catch (error) {
    svc.log.error(error, 'Error fixing activity relations!')
    throw error
  }
}
