import * as eagleeye from '@crowd/data-access-layer/src/old/apps/emails_worker/eagleeye'

import { svc } from '../../main'
import { UserTenantWithEmailSent } from '../../types/user'
import { nextEmailAt } from '../../utils/date'

/*
eagleeyeUpdateNextEmailAt is a Temporal activity that updates when the next daily
or weekly EagleEye digest email should be send at, depending on the user's settings.
*/
export async function eagleeyeUpdateNextEmailAt(emailSent: UserTenantWithEmailSent): Promise<void> {
  try {
    await eagleeye.updateNextEmailAt(
      svc.postgres.writer,
      emailSent.tenantId,
      emailSent.userId,
      nextEmailAt(emailSent.settings.eagleEye.emailDigest),
    )
  } catch (err) {
    throw new Error(err)
  }
}
