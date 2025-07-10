import {
  IActivityRelationDuplicateGroup,
  deleteActivityRelationsById,
  fetchActivityRelationsDuplicateGroups,
} from '@crowd/data-access-layer/src/activityRelations'
import ActivityRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/activity.repo'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'

import { svc } from '../../main'

export async function getActivityRelationsDuplicateGroups(
  limit: number,
  cursor?: Omit<IActivityRelationDuplicateGroup, 'activityIds'>,
): Promise<IActivityRelationDuplicateGroup[]> {
  const qx = pgpQx(svc.postgres.reader.connection())
  return fetchActivityRelationsDuplicateGroups(qx, limit, cursor)
}

export async function deleteActivityRelations(activityIds: string[]): Promise<void> {
  const qx = pgpQx(svc.postgres.writer.connection())
  return deleteActivityRelationsById(qx, activityIds)
}

export async function checkActivitiesWithTimestampExistInQuestDb(
  activityIds: string[],
  timestamp: string,
): Promise<string[]> {
  const activityRepo = new ActivityRepository(
    svc.postgres.reader.connection(),
    svc.log,
    svc.questdbSQL,
  )

  return activityRepo.checkActivitiesWithTimestampExistInQuestDb(activityIds, timestamp)
}
