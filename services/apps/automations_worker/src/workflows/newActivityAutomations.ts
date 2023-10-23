import { getChildLogger } from '@crowd/logging'
import { executeChild, proxyActivities } from '@temporalio/workflow'
import * as activities from '../activities/newActivityAutomations'
import { serviceLog } from '../main'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function processNewActivityAutomation(
  tenantId: string,
  activityId: string,
): Promise<void> {
  const log = getChildLogger('processNewActivityAutomation', serviceLog, {
    tenantId,
    activityId,
  })

  log.info('Processing new activity automation')

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
  const log = getChildLogger('triggerActivityAutomationExecution', serviceLog, {
    automationId,
    activityId,
  })

  log.info('Triggering new activity automation')
  await activity.triggerActivityAutomationExecution(automationId, activityId)
}
