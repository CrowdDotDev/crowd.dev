import { IProcessNewMemberAutomationInput } from '../types'
import { svc } from '../main'

export async function processNewMemberAutomation(
  args: IProcessNewMemberAutomationInput,
): Promise<void> {
  svc.log.info(
    { tenantId: args.memberId, memberId: args.memberId },
    'Processing new member automation',
  )

  // first detect if there are any automations to trigger
}
