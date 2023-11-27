import {
  WorkflowIdReusePolicy,
  executeChild,
  proxyActivities,
  workflowInfo,
} from '@temporalio/workflow'
import * as activities from '../activities/newActivityAutomations'
import { IProcessNewActivityAutomationArgs, ITriggerActivityAutomationArgs } from '@crowd/types'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function processNewActivityAutomation(
  args: IProcessNewActivityAutomationArgs,
): Promise<void> {
  const automationsToTrigger = await activity.detectNewActivityAutomations(
    args.tenantId,
    args.activityId,
  )

  const info = workflowInfo()

  if (automationsToTrigger.length > 0) {
    await Promise.all(
      automationsToTrigger.map((a) =>
        executeChild(triggerActivityAutomationExecution, {
          workflowId: `${info.workflowId}/${a}`,
          workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_REJECT_DUPLICATE,
          retry: {
            maximumAttempts: info.retryPolicy?.maximumAttempts ?? 100,
          },
          args: [
            {
              automationId: a,
              activityId: args.activityId,
            },
          ],
          searchAttributes: {
            TenantId: [args.tenantId],
          },
        }),
      ),
    )
  }
}

export async function triggerActivityAutomationExecution(
  args: ITriggerActivityAutomationArgs,
): Promise<void> {
  await activity.triggerActivityAutomationExecution(args.automationId, args.activityId)
}
