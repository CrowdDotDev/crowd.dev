import { v4 as uuid } from 'uuid'

import { svc } from '../main'
import { UserTenantWithEmailSent } from '../types/user'

/*
updateEmailHistory is a Temporal activity that inserts a new row in the database
informing a new recurring email has been sent to the user.
*/
export async function updateEmailHistory(emailSent: UserTenantWithEmailSent): Promise<void> {
  try {
    await svc.postgres.writer.connection().query(
      `INSERT INTO "recurringEmailsHistory" ("id", "type", "tenantId", "emailSentAt", "emailSentTo", "weekOfYear")
        VALUES ($1, $2, $3, $4, $5, $6);`,
      [
        uuid(),
        emailSent.type,
        emailSent.tenantId,
        emailSent.sentAt,
        emailSent.emails,
        emailSent.weekOfYear || null,
      ],
    )
  } catch (err) {
    throw new Error(err)
  }
}
