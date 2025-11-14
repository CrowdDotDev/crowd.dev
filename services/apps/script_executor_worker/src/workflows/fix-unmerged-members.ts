import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { ITriggerMemberUnmergeWorkflowArgs } from '../types'

const { triggerMemberUnmergeWorkflow } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function fixUnmergedMembers(args: ITriggerMemberUnmergeWorkflowArgs): Promise<void> {
  console.log(
    `Triggering unmerge workflow for member ${args.memberId} and secondary member ${args.secondaryMemberId}`,
  )

  await triggerMemberUnmergeWorkflow(args.memberId, args.secondaryMemberId)
}
