import { MergeActionState, MergeActionStep } from '@crowd/types'
import { svc } from '../main'
import { updateMergeActionState } from '@crowd/data-access-layer/src/old/apps/entity_merging_worker'

export async function setMergeAction(
  primaryId: string,
  secondaryId: string,
  tenantId: string,
  data: { state?: MergeActionState; step?: MergeActionStep },
): Promise<void> {
  await updateMergeActionState(svc.postgres.writer, primaryId, secondaryId, tenantId, data)
}
