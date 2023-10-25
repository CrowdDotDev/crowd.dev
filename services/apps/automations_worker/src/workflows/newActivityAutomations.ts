import { executeChild, proxyActivities } from '@temporalio/workflow'
import * as activities from '../activities/newActivityAutomations'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function processNewActivityAutomation(
  tenantId: string,
  activityId: string,
): Promise<void> {
  const automationsToTrigger = await activity.detectNewActivityAutomations(tenantId, activityId)

  if (automationsToTrigger.length > 0) {
    await Promise.all(
      automationsToTrigger.map((a) =>
        executeChild(triggerActivityAutomationExecution, {
          args: [a, activityId],
        }),
      ),
    )
  }
}

export async function triggerActivityAutomationExecution(
  automationId: string,
  activityId: string,
): Promise<void> {
  await activity.triggerActivityAutomationExecution(automationId, activityId)
}
