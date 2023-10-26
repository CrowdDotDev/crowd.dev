import { getChildLogger } from '@crowd/logging'
import { svc } from '../main'
import { AutomationService } from '../services/automation.service'

export async function triggerActivityAutomationExecution(
  automationId: string,
  activityId: string,
): Promise<void> {
  const log = getChildLogger('triggerActivityAutomationExecution', svc.log, {
    automationId,
    activityId,
  })

  const service = new AutomationService(svc.postgres.writer, svc.redis, log)
  const payload = await service.getActivity(activityId)
  if (!payload) {
    log.warn('Activity not found, skipping execution')
    return
  }
  await service.triggerAutomationExecution(automationId, activityId, payload)
}

// returns automation ids to trigger
export async function detectNewActivityAutomations(
  tenantId: string,
  activityId: string,
): Promise<string[]> {
  const log = getChildLogger('detectNewActivityAutomations', svc.log, {
    tenantId,
    activityId,
  })

  const service = new AutomationService(svc.postgres.reader, svc.redis, log)
  return service.detectNewActivityAutomations(tenantId, activityId)
}
