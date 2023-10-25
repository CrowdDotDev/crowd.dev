import { v4 as uuid } from 'uuid'

import { svc } from '../main'
import { UserTenantWithEmailSent } from '../types'
import { nextEmailAt } from '../utils/date'

/*
updateEmailHistory is a Temporal activity that inserts a new row in the database
informing a new recurring email has been sent to the user.
*/
export async function updateEmailHistory(emailSent: UserTenantWithEmailSent): Promise<void> {
  try {
    await svc.postgres.writer.connection().query(
      `INSERT INTO "recurringEmailsHistory" ("id", "type", "tenantId", "emailSentAt", "emailSentTo")
        VALUES ($1, 'eagle-eye-digest', $2, $3, ARRAY[$4]);`,
      [
        uuid(),
        emailSent.tenantId,
        emailSent.sentAt,
        emailSent.settings.eagleEye.emailDigest?.email,
      ],
    )
  } catch (err) {
    throw new Error(err)
  }
}

/*
updateNextEmailAt is a Temporal activity that updates when the next daily or
weekly email should be send at, depending on the user's settings.
*/
export async function updateNextEmailAt(emailSent: UserTenantWithEmailSent): Promise<void> {
  try {
    await svc.postgres.writer.connection().query(
      `UPDATE "tenantUsers"
        SET settings = jsonb_set(settings, '{eagleEye,emailDigest}', '{"nextEmailAt": $1~}'::JSONB, TRUE)
        WHERE "tenantId" = $2 AND "userId" = $3;`,
      [nextEmailAt(emailSent.settings.eagleEye.emailDigest), emailSent.tenantId, emailSent.userId],
    )
  } catch (err) {
    throw new Error(err)
  }
}
