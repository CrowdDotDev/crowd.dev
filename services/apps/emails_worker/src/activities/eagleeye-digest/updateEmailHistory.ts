import { svc } from '../../main'
import { UserTenantWithEmailSent } from '../../types/user'
import { nextEmailAt } from '../../utils/date'

/*
eagleeyeUpdateNextEmailAt is a Temporal activity that updates when the next daily
or weekly EagleEye digest email should be send at, depending on the user's settings.
*/
export async function eagleeyeUpdateNextEmailAt(emailSent: UserTenantWithEmailSent): Promise<void> {
  try {
    await svc.postgres.writer.connection().query(
      `UPDATE "tenantUsers"
      SET settings = jsonb_set(settings, '{eagleEye,emailDigest,nextEmailAt}', to_jsonb($1::TEXT), TRUE)
      WHERE "tenantId" = $2 AND "userId" = $3;`,
      [nextEmailAt(emailSent.settings.eagleEye.emailDigest), emailSent.tenantId, emailSent.userId],
    )
  } catch (err) {
    throw new Error(err)
  }
}
