import { svc } from '../main'

// returns automation ids to trigger
export async function detectNewMemberAutomations(
  tenantId: string,
  memberId: string,
): Promise<string[]> {
  svc.log.debug({ tenantId, memberId }, 'Detecting new member automations!')

  // todo load automations for this tenant and this type from database
}
