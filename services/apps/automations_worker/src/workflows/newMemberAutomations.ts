import { getChildLogger } from '@crowd/logging'
import { IProcessNewMemberAutomationInput } from '../types'
import { serviceLog } from '../main'
import * as activities from '../activities/newMemberAutomations'
import { proxyActivities, workflowInfo } from '@temporalio/workflow'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function processNewMemberAutomation(
  args: IProcessNewMemberAutomationInput,
): Promise<void> {
  const workflowId = workflowInfo().workflowId
  const runId = workflowInfo().runId

  const log = getChildLogger('processNewMemberAutomation', serviceLog, {
    tenantId: args.tenantId,
    memberId: args.memberId,
    workflowId,
    runId,
  })

  log.info('Processing new member automation')

  // first detect if there are any automations to trigger
  const automationsToTrigger = await activity.detectNewMemberAutomations(
    args.tenantId,
    args.memberId,
  )

  // if there are any automations to trigger, trigger them
  await Promise.all(
    automationsToTrigger.map((a) =>
      activity.triggerAutomationExecution(args.tenantId, a, args.memberId),
    ),
  )
}
