import ActivityRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/activity.repo'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'
import {
  EntityType,
  IDuplicateMembersToCleanup,
} from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'

import { svc } from '../../main'

export async function findDuplicateMembersAfterDate(
  cutoffDate: string,
  limit: number,
  checkByActivityIdentity: boolean,
  checkByTwitterIdentity: boolean,
): Promise<IDuplicateMembersToCleanup[]> {
  try {
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
    return memberRepo.findDuplicateMembersAfterDate(
      cutoffDate,
      limit,
      checkByActivityIdentity,
      checkByTwitterIdentity,
    )
  } catch (error) {
    svc.log.error(error, 'Error finding duplicate members after cutoff date!')
    throw error
  }
}

export async function moveMemberActivityRelations(
  primaryId: string,
  secondaryId: string,
): Promise<void> {
  try {
    const activityRepo = new ActivityRepository(svc.postgres.writer.connection(), svc.log)
    await activityRepo.moveActivityRelations(primaryId, secondaryId, EntityType.MEMBER)
  } catch (error) {
    svc.log.error(error, 'Error updating activity relations for duplicate members!')
    throw error
  }
}
