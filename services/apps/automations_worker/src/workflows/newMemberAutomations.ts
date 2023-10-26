import { executeChild, proxyActivities } from '@temporalio/workflow'
import * as activities from '../activities/newMemberAutomations'
import { IProcessNewMemberAutomationArgs, ITriggerMemberAutomationArgs } from '@crowd/types'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function processNewMemberAutomation(
  args: IProcessNewMemberAutomationArgs,
): Promise<void> {
  // first detect if there are any automations to trigger
  const automationsToTrigger = await activity.detectNewMemberAutomations(
    args.tenantId,
    args.memberId,
  )

  // if there are any automations to trigger, trigger them
  if (automationsToTrigger.length > 0) {
    await Promise.all(
      automationsToTrigger.map((a) =>
        executeChild(triggerMemberAutomationExecution, {
          args: [
            {
              automationId: a,
              memberId: args.memberId,
            },
          ],
        }),
      ),
    )
  }
}

export async function triggerMemberAutomationExecution(
  args: ITriggerMemberAutomationArgs,
): Promise<void> {
  await activity.triggerMemberAutomationExecution(args.automationId, args.memberId)
}
