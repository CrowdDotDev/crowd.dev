import {
  deleteActivityRelationsById,
  fetchActivityRelationsDuplicateGroup,
} from '@crowd/data-access-layer/src/activityRelations'
import ActivityRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/activity.repo'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'

import { svc } from '../../main'

export async function getActivityRelationsDuplicateGroup(): Promise<
  {
    activityId: string
    timestamp: string
  }[]
> {
  const qx = pgpQx(svc.postgres.reader.connection())
  return fetchActivityRelationsDuplicateGroup(qx)
}

export async function deleteActivityRelations(activityIds: string[]): Promise<void> {
  const qx = pgpQx(svc.postgres.writer.connection())
  return deleteActivityRelationsById(qx, activityIds)
}

export async function checkIfActivitiesExistInQuestDb(
  activityIds: string[],
  start: string,
  end: string,
): Promise<string[]> {
  const activityRepo = new ActivityRepository(
    svc.postgres.reader.connection(),
    svc.log,
    svc.questdbSQL,
  )

  return activityRepo.checkIfActivitiesExistInQuestDb(activityIds, start, end)
}
