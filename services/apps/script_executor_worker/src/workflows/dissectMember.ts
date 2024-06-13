import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  proxyActivities,
  startChild,
  workflowInfo,
} from '@temporalio/workflow'

import * as activities from '../activities/dissect-member'
import * as commonActivities from '../activities/common'
import { IDissectMemberArgs } from '../types'
import { IMemberUnmergeBackup, IUnmergeBackup } from '@crowd/types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 minute',
  retry: { maximumAttempts: 3 },
})

const common = proxyActivities<typeof commonActivities>({
  startToCloseTimeout: '5 minute',
  retry: { maximumAttempts: 6, backoffCoefficient: 3 },
})

export async function dissectMember(args: IDissectMemberArgs): Promise<void> {
  const info = workflowInfo()

  // check if memberId exist in db before unmerging
  const member = await activity.findMemberById(args.memberId)

  if (!member) {
    console.log(`memberId ${args.memberId} not found!`)
    return
  }

  const mergeActions = await activity.findMemberMergeActions(
    args.memberId,
    args.startDate,
    args.endDate,
    args.userId,
  )

  for (const mergeAction of mergeActions) {
    // 1. call api.unmerge using backups
    // 2. wait for temporal async stuff to complete
    // 3. call the same workflow again for the unmerged secondary member

    await common.unmergeMembers(
      mergeAction.primaryId,
      mergeAction.unmergeBackup as IUnmergeBackup<IMemberUnmergeBackup>,
      mergeAction.tenantId,
    )

    const workflowId = `finishMemberUnmerging/${mergeAction.primaryId}/${mergeAction.secondaryId}`

    await common.waitForTemporalWorkflowExecutionFinish(workflowId)

    startChild(dissectMember, {
      workflowId: `${info.workflowId}/${mergeAction.secondaryId}`,
      cancellationType: ChildWorkflowCancellationType.ABANDON,
      parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
      retry: {
        backoffCoefficient: 2,
        initialInterval: 2 * 1000,
        maximumInterval: 30 * 1000,
      },
      args: [
        {
          ...args,
          memberId: mergeAction.secondaryId,
        },
      ],
      searchAttributes: {
        TenantId: [mergeAction.tenantId],
      },
    })

    console.log(
      `Finished unmerging member ${mergeAction.secondaryId} from ${mergeAction.primaryId}!`,
    )
  }
}
