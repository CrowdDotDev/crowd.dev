import { updateMergeActionState } from '@crowd/data-access-layer/src/old/apps/entity_merging_worker'
import { MergeActionState, MergeActionStep } from '@crowd/types'

import { svc } from '../main'

export async function setMergeAction(
  primaryId: string,
  secondaryId: string,
  data: { state?: MergeActionState; step?: MergeActionStep },
): Promise<void> {
  await updateMergeActionState(svc.postgres.writer, primaryId, secondaryId, data)
}
