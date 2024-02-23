import { MergeActionState } from '@crowd/types'
import { svc } from '../main'
import { updateMergeActionState } from '@crowd/data-access-layer/src/old/apps/entity_merging_worker'

export async function setMergeActionState(
  primaryId: string,
  secondaryId: string,
  tenantId: string,
  state: MergeActionState,
): Promise<void> {
  await updateMergeActionState(svc.postgres.writer, primaryId, secondaryId, tenantId, state)
}
