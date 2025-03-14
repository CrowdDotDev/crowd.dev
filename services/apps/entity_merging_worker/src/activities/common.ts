import { getActivityRelations } from '@crowd/data-access-layer/src/activities/sql'
import { updateMergeActionState } from '@crowd/data-access-layer/src/old/apps/entity_merging_worker'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { MergeActionState, MergeActionStep } from '@crowd/types'

import { svc } from '../main'

export async function setMergeAction(
  primaryId: string,
  secondaryId: string,
  data: { state?: MergeActionState; step?: MergeActionStep },
): Promise<void> {
  await updateMergeActionState(svc.postgres.writer, primaryId, secondaryId, data)
}

/**
 * Uses activityRelations to check for remaining activities linked to the secondary entity,
 * as QuestDB may still be processing merged activities.
 */
export async function checkIfActivitiesAreMoved(
  entityId: string,
  entityType: 'member' | 'organization',
): Promise<void> {
  const qx = pgpQx(svc.postgres.reader.connection())
  const records = await getActivityRelations(qx, {
    filter: {
      [entityType === 'member' ? 'memberId' : 'organizationId']: entityId,
    },
    countOnly: true,
  })

  if (records.count > 0) {
    svc.log.error(`${records.count} activities still associated with ${entityType} ${entityId}`)
    throw new Error(`Failed to complete merge!`)
  }
}
