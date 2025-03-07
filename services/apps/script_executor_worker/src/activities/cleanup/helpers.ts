import ActivityRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/activity.repo'
import CleanupExcludeListRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/cleanupExcludeList.repo'
import { EntityType } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'

import { svc } from '../../main'

export async function hasActivityRecords(
  entityId: string,
  entityType: EntityType,
): Promise<boolean> {
  try {
    const activityRepo = new ActivityRepository(
      svc.postgres.reader.connection(),
      svc.log,
      svc.questdbSQL,
    )
    return activityRepo.hasActivitiesInQuestDb(entityId, entityType)
  } catch (error) {
    svc.log.error(error, 'Error checking if entity has activities in questDb!')
    throw error
  }
}

export async function excludeEntityFromCleanup(
  entityId: string,
  entityType: EntityType,
): Promise<void> {
  try {
    const orgRepo = new CleanupExcludeListRepository(svc.postgres.writer.connection(), svc.log)
    await orgRepo.addToExcludeList(entityId, entityType)
  } catch (error) {
    svc.log.error(error, 'Error adding entity to cleanup exclude list!')
    throw error
  }
}
