import { IMergeAction, MergeActionState, MergeActionStep, MergeActionType } from '@crowd/types'
import { svc } from '../main'

import { getIncompleteMergeActions, updateMergeAction } from '@crowd/data-access-layer/src/mergeActions/repo'
import { pgpQx } from '@crowd/data-access-layer'

export async function getCancelledMergeAndUnmergeWorkflows(type: MergeActionType, step: MergeActionStep) {
    let mergeActions: IMergeAction[] = []
    const qx = pgpQx(svc.postgres.reader.connection())

    if (type === MergeActionType.MEMBER) {
        mergeActions = await getIncompleteMergeActions(qx, MergeActionType.MEMBER, step)
    } else if (type === MergeActionType.ORG) {
        mergeActions = await getIncompleteMergeActions(qx, MergeActionType.ORG, step)
    }

    return mergeActions
}

export async function resetMergeActionState(primaryId: string, secondaryId: string) {
    const qx = pgpQx(svc.postgres.reader.connection())

    await updateMergeAction(qx, primaryId, secondaryId, 'pending')
}
  