import ActivityRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/activity.repo'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'
import OrganizationRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/organization.repo'

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

export async function removeBotMemberOrganization(memberId: string): Promise<void> {
  try {
    const memberRepo = new OrganizationRepository(svc.postgres.writer.connection(), svc.log)
    await memberRepo.deleteMemberOrganizations(memberId)
  } catch (error) {
    svc.log.error(error, 'Error removing bot member organization!')
    throw error
  }
}

export async function unlinkOrganizationFromBotActivities(memberId: string): Promise<void> {
  try {
    const activityRepo = new ActivityRepository(
      svc.postgres.writer.connection(),
      svc.log,
      svc.questdbSQL,
    )

    // unlink organization for bot activities
    // this is to prevent bots from showing up in insights leaderboard
    await activityRepo.removeOrganizationAffiliationForMembers(memberId)
  } catch (error) {
    svc.log.error(error, 'Error unlinking organization from bot activities!')
    throw error
  }
}
