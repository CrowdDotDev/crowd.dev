import { ChildWorkflowCancellationType, ParentClosePolicy, startChild } from '@temporalio/workflow'

import { recalculateAffiliationsForNewRoles } from './recalculateAffiliationsForNewRoles'

export async function triggerRecalculateAffiliations(): Promise<void> {
  startChild(recalculateAffiliationsForNewRoles, {
    cancellationType: ChildWorkflowCancellationType.ABANDON,
    parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
    retry: {
      backoffCoefficient: 2,
      initialInterval: 2 * 1000,
      maximumInterval: 30 * 1000,
    },
    args: [{}],
    searchAttributes: {},
  })
}
