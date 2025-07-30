import { MergeActionStep, MergeActionType } from '@crowd/types'
import { svc } from '../main'

import { getIncompleteMergeActions, updateMergeAction } from '@crowd/data-access-layer/src/mergeActions/repo'
import { pgpQx } from '@crowd/data-access-layer'

export async function getCancelledMergeAndUnmergeWorkflows(type: MergeActionType, step: MergeActionStep, limit?: number) {
    const qx = pgpQx(svc.postgres.reader.connection())

    return getIncompleteMergeActions(qx, type, step, limit)
}

export async function resetMergeActionState(primaryId: string, secondaryId: string) {
    const qx = pgpQx(svc.postgres.writer.connection())

    await updateMergeAction(qx, primaryId, secondaryId, 'pending')
}
  