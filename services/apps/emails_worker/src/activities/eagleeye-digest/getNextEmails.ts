import { svc } from '../../main'
import { UserTenant } from '../../types/user'

/*
eagleeyeGetNextEmails is a Temporal activity that fetches all users along their
EagleEye settings to send emails to. This relies on some settings, such as when
the next email should send at.
*/
export async function eagleeyeGetNextEmails(): Promise<UserTenant[]> {
  let rows: UserTenant[] = []
  try {
    rows = await svc.postgres.reader.connection().query(
      `SELECT "userId", "tenantId", settings, users.email
        FROM "tenantUsers"
        INNER JOIN users ON "tenantUsers"."userId" = users.id
        WHERE (settings -> 'eagleEye' -> 'emailDigestActive')::BOOLEAN IS TRUE
        AND (settings -> 'eagleEye' ->> 'onboarded')::BOOLEAN IS TRUE
        AND (settings -> 'eagleEye' -> 'emailDigest' ->> 'nextEmailAt')::TIMESTAMP < NOW()
        AND "tenantId" IS NOT NULL
        AND users."deletedAt" IS NULL;`,
    )
  } catch (err) {
    throw new Error(err)
  }

  return rows
}
