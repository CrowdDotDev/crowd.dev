import ActivityRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/activity.repo'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'
import OrganizationRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/organization.repo'
import { formatQuery } from '@crowd/data-access-layer/src/queryExecutor'

import { svc } from '../main'

export async function getBotMembersWithOrgAffiliation(batchSize: number): Promise<string[]> {
  try {
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
    return memberRepo.getBotMembersWithOrgAffiliation(batchSize)
  } catch (error) {
    svc.log.error(error, 'Error getting bot like member profiles!')
    throw error
  }
}

export async function removeBotMemberOrganization(memberIds: string[]): Promise<void> {
  try {
    const memberRepo = new OrganizationRepository(svc.postgres.writer.connection(), svc.log)
    await memberRepo.deleteMemberOrganizations(memberIds)
  } catch (error) {
    svc.log.error(error, 'Error removing bot member organization!')
    throw error
  }
}

export async function unlinkOrganizationFromBotActivities(memberIds: string[]): Promise<void> {
  try {
    const activityRepo = new ActivityRepository(
      svc.postgres.writer.connection(),
      svc.log,
      svc.questdbSQL,
    )

    // unlink organization for bot activities
    // this is to prevent bots from showing up in insights leaderboard
    await activityRepo.updateActivityRelations(
      { organizationId: null },
      formatQuery(`"organizationId" IS NOT NULL AND "memberId" IN ($(memberIds:csv))`, {
        memberIds,
      }),
    )
  } catch (error) {
    svc.log.error(error, 'Error unlinking organization from bot activities!')
    throw error
  }
}
