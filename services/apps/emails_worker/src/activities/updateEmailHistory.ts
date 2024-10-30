import { updateRecurringEmailsHistory } from '@crowd/data-access-layer/src/old/apps/emails_worker/emails'

import { svc } from '../main'
import { UserTenantWithEmailSent } from '../types/user'

/*
updateEmailHistory is a Temporal activity that inserts a new row in the database
informing a new recurring email has been sent to the user.
*/
export async function updateEmailHistory(emailSent: UserTenantWithEmailSent): Promise<void> {
  try {
    const db = svc.postgres.writer
    const type = emailSent.type
    const tenantId = emailSent.tenantId
    const sentAt = emailSent.sentAt
    const emails = emailSent.emails
    const weekOfYear = emailSent.weekOfYear || null
    await updateRecurringEmailsHistory(db, type, tenantId, sentAt, emails, weekOfYear)
  } catch (err) {
    throw new Error(err)
  }
}
