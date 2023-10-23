import { getChildLogger } from '@crowd/logging'
import { dbStore, redis, serviceLog } from '../main'
import { AutomationService } from '../services/automation.service'

export async function triggerMemberAutomationExecution(
  automationId: string,
  memberId: string,
): Promise<void> {
  const log = getChildLogger('triggerMemberAutomationExecution', serviceLog, {
    automationId,
    memberId,
  })

  const service = new AutomationService(dbStore, redis, log)
  const payload = await service.getMember(memberId)
  if (!payload) {
    log.warn('Member not found, skipping execution')
    return
  }
  await service.triggerAutomationExecution(automationId, memberId, payload)
}

// returns automation ids to trigger
export async function detectNewMemberAutomations(
  tenantId: string,
  memberId: string,
): Promise<string[]> {
  const log = getChildLogger('detectNewMemberAutomations', serviceLog, {
    tenantId,
    memberId,
  })

  const service = new AutomationService(dbStore, redis, log)
  return service.detectNewMemberAutomations(tenantId, memberId)
}
