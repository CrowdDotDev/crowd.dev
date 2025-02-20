import { runMemberAffiliationsUpdate } from '@crowd/data-access-layer/src/old/apps/profiles_worker'

import { svc } from '../../main'

export async function calculateMemberAffiliations(memberId: string): Promise<void> {
  try {
    await runMemberAffiliationsUpdate(svc.postgres.writer, svc.questdbSQL, svc.queue, memberId)
  } catch (err) {
    throw new Error(err)
  }
}
