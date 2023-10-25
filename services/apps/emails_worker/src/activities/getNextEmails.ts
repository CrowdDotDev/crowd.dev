import { svc } from '../main'
import { UserTenant } from '../types'

/*
getNextEmails is a Temporal activity that fetches all users along their EagleEye
settings to send emails to. This relies on some settings, such as when the next
email should send at.
*/
export async function getNextEmails(): Promise<UserTenant[]> {
  let users: UserTenant[] = []
  try {
    users = await svc.postgres.reader.connection().query(
      `SELECT "userId", "tenantId", "settings" FROM "tenantUsers"
        WHERE (settings -> 'eagleEye' -> 'emailDigestActive')::BOOLEAN IS TRUE
        AND (settings -> 'eagleEye' ->> 'onboarded')::BOOLEAN IS TRUE
        AND (settings -> 'eagleEye' -> 'emailDigest' ->> 'nextEmailAt')::TIMESTAMP < NOW();`,
    )
  } catch (err) {
    throw new Error(err)
  }

  return users
}
