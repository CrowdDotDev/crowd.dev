import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  startChild,
  workflowInfo,
} from '@temporalio/workflow'

import { recalculateAffiliationsForNewRoles } from './recalculateAffiliationsForNewRoles'

export async function triggerRecalculateAffiliations(): Promise<void> {
  const info = workflowInfo()

  startChild(recalculateAffiliationsForNewRoles, {
    workflowId: `${info.workflowId}`,
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
