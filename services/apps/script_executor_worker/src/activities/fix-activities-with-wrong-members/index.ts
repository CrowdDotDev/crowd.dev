import { IActivityPartial } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'
import { svc } from '../../main'
import ActivityRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/activity.repo'

export async function findActivitiesWithWrongMemberId(
  tenantId: string,
  limit: number,
): Promise<IActivityPartial[]> {
  let rows: IActivityPartial[] = []

  try {
    const activityRepo = new ActivityRepository(svc.postgres.reader.connection(), svc.log)
    rows = await activityRepo.findActivitiesWithWrongMemberId(tenantId, limit)
  } catch (err) {
    throw new Error(err)
  }

  return rows
}

export async function updateActivityMember(id: string, memberId: string): Promise<void> {
  try {
    const activityRepo = new ActivityRepository(svc.postgres.writer.connection(), svc.log)
    await activityRepo.updateActivityMember(id, memberId)
  } catch (err) {
    throw new Error(err)
  }
}
