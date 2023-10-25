import { executeChild, proxyActivities } from '@temporalio/workflow'
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

  if (automationsToTrigger.length > 0) {
    await Promise.all(
      automationsToTrigger.map((a) =>
        executeChild(triggerActivityAutomationExecution, {
          args: [
            {
              automationId: a,
              activityId: args.activityId,
            },
          ],
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
