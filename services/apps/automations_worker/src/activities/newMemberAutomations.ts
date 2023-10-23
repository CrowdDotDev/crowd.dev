import { getChildLogger } from '@crowd/logging'
import { Context } from '@temporalio/activity'
import { dbStore, redis, serviceLog } from '../main'
import { AutomationService } from '../services/automation.service'

export async function triggerAutomationExecution(
  tenantId: string,
  automationId: string,
  memberId: string,
): Promise<void> {
  const workflowExecution = Context.current().info.workflowExecution
  const workflowId = workflowExecution.workflowId
  const runId = workflowExecution.runId

  const log = getChildLogger('triggerAutomationExecution', serviceLog, {
    workflowId,
    runId,
    automationId,
    tenantId,
    memberId,
  })

  const service = new AutomationService(dbStore, redis, log)
  await service.triggerAutomationExecution(tenantId, automationId)
}

// returns automation ids to trigger
export async function detectNewMemberAutomations(
  tenantId: string,
  memberId: string,
): Promise<string[]> {
  const workflowExecution = Context.current().info.workflowExecution
  const workflowId = workflowExecution.workflowId
  const runId = workflowExecution.runId

  const log = getChildLogger('detectNewMemberAutomations', serviceLog, {
    workflowId,
    runId,
    tenantId,
    memberId,
  })

  const service = new AutomationService(dbStore, redis, log)
  return service.detectNewMemberAutomations(tenantId, memberId)
}
