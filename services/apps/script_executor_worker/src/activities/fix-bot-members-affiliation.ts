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
    const activityRepo = new ActivityRepository(svc.postgres.writer.connection(), svc.log)

    const batchSize = 1000
    const where = '"organizationId" is not null'

    // get activity ids for member in batch of 1000
    let activityIds = await activityRepo.getActivityIdsForMember(memberId, where, batchSize)

    while (activityIds.length > 0) {
      await activityRepo.removeOrgAffiliationForActivities(activityIds)

      svc.log.info({ memberId }, 'Fetching next batch to process!')
      activityIds = await activityRepo.getActivityIdsForMember(memberId, where, batchSize)
    }

    svc.log.info({ memberId }, 'Unlinked organization from bot activities!')
  } catch (error) {
    svc.log.error(error, 'Error unlinking organization from bot activities!')
    throw error
  }
}
