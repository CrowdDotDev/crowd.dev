import { svc } from '../../main'
import { UserTenantWithEmailSent } from '../../types/user'
import { nextEmailAt } from '../../utils/date'

/*
updateNextEmailAt is a Temporal activity that updates when the next daily or
weekly EagleEye digest email should be send at, depending on the user's settings.
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
