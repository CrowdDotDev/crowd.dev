import MergeActionRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/mergeAction.repo'
import { IMergeAction } from '@crowd/types'

import { svc } from '../../main'

export async function findMergeActionsWithDeletedSecondaryMembers(
  limit: number,
  offset: number,
): Promise<IMergeAction[]> {
  try {
    const mergeActionRepo = new MergeActionRepository(svc.postgres.reader.connection(), svc.log)
    return mergeActionRepo.findMergeActionsWithDeletedSecondaryEntities(limit, offset, 'member')
  } catch (error) {
    svc.log.error(error, 'Error getting merge actions with deleted secondary members!')
    throw error
  }
}

// export async function getActivities(
//   entityId: string,
//   entityType: 'member' | 'org',
// ): Promise<IActivity[]> {
//   try {
//     const activityRepo = new ActivityRepository(svc.postgres.reader.connection(), svc.log)
//     return activityRepo.getActivitiesByMemberId(memberId)
//   } catch (error) {
//     svc.log.error(error, 'Error getting activities by member id!')
//     throw error
//   }
// }

// getActivitiesByMemberId
// updateActivities
// syncMembers
