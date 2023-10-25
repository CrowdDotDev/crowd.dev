import { executeChild, proxyActivities } from '@temporalio/workflow'
import * as activities from '../activities/newMemberAutomations'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function processNewMemberAutomation(
  tenantId: string,
  memberId: string,
): Promise<void> {
  // first detect if there are any automations to trigger
  const automationsToTrigger = await activity.detectNewMemberAutomations(tenantId, memberId)

  // if there are any automations to trigger, trigger them
  if (automationsToTrigger.length > 0) {
    await Promise.all(
      automationsToTrigger.map((a) =>
        executeChild(triggerMemberAutomationExecution, {
          args: [a, memberId],
        }),
      ),
    )
  }
}

export async function triggerMemberAutomationExecution(
  automationId: string,
  memberId: string,
): Promise<void> {
  await activity.triggerMemberAutomationExecution(automationId, memberId)
}
