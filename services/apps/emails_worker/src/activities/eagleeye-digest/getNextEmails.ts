import { FeatureFlag } from '@crowd/types'
import { isFeatureEnabled } from '@crowd/feature-flags'

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
      `SELECT "userId", "tenantId", "settings" FROM "tenantUsers"
        WHERE (settings -> 'eagleEye' -> 'emailDigestActive')::BOOLEAN IS TRUE
        AND (settings -> 'eagleEye' ->> 'onboarded')::BOOLEAN IS TRUE
        AND (settings -> 'eagleEye' -> 'emailDigest' ->> 'nextEmailAt')::TIMESTAMP < NOW()
        AND "tenantId" IS NOT NULL;`,
    )
  } catch (err) {
    throw new Error(err)
  }

  // Filter rows to only return tenants with this feature flag enabled.
  const users: UserTenant[] = []
  for (const row of rows) {
    if (
      await isFeatureEnabled(
        FeatureFlag.TEMPORAL_EMAILS,
        async () => {
          return {
            tenantId: row.tenantId,
          }
        },
        svc.unleash,
      )
    ) {
      users.push(row)
    }
  }

  return users
}
