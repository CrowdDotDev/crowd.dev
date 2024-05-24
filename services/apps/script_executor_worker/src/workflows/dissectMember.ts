import { proxyActivities } from '@temporalio/workflow'

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
  const mergeActions = await activity.findMemberMergeActions(
    args.memberId,
    args.startDate,
    args.endDate,
    args.userId,
  )

  for (const mergeAction of mergeActions) {
    // call api.unmerge, and then wait for corresponding async temporal finishMemberUnmerging workflow to complete
    // 1. call api.unmerge using backups
    // 2. wait for temporal async stuff to complete

    await common.unmergeMembers(
      mergeAction.primaryId,
      mergeAction.unmergeBackup as IUnmergeBackup<IMemberUnmergeBackup>,
      mergeAction.tenantId,
    )

    const workflowId = `finishMemberUnmerging/${mergeAction.primaryId}/${mergeAction.secondaryId}`

    await activity.waitForTemporalWorkflowExecutionFinish(workflowId)

    console.log(
      `Finished unmerging member ${mergeAction.secondaryId} from ${mergeAction.primaryId}!`,
    )
  }
}
