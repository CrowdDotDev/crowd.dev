import { refreshMemberOrganizationAffiliations } from '@crowd/data-access-layer/src/member-organization-affiliation'
import ActivityRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/activity.repo'
import MergeActionRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/mergeAction.repo'
import { EntityType } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { IMergeAction } from '@crowd/types'

import { svc } from '../../main'

export async function findMergeActionsWithDeletedSecondaryEntities(
  limit: number,
  offset: number,
  entityType: EntityType,
): Promise<IMergeAction[]> {
  try {
    const mergeActionRepo = new MergeActionRepository(svc.postgres.reader.connection(), svc.log)
    return mergeActionRepo.findMergeActionsWithDeletedSecondaryEntities(limit, offset, entityType)
  } catch (error) {
    svc.log.error(error, `Error getting merge actions with deleted secondary ${entityType}s !`)
    throw error
  }
}

export async function moveActivitiesToCorrectEntity(
  oldEntityId: string,
  newEntityId: string,
  type: EntityType,
): Promise<void> {
  try {
    const activityRepo = new ActivityRepository(
      svc.postgres.reader.connection(),
      svc.log,
      svc.questdbSQL,
    )
    svc.log.info(`Moving ${type} activities from ${oldEntityId} to ${newEntityId}`)
    await activityRepo.moveActivitiesToCorrectEntity(oldEntityId, newEntityId, type)
  } catch (error) {
    svc.log.error(error, 'Error moving activities to correct entity!')
    throw error
  }
}

export async function calculateMemberAffiliations(memberId: string): Promise<void> {
  try {
    const qx = pgpQx(svc.postgres.writer.connection())
    await refreshMemberOrganizationAffiliations(qx, memberId)
  } catch (err) {
    throw new Error(err)
  }
}
