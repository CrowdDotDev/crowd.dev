import { IMember, FeatureFlag } from '@crowd/types'
import { isFeatureEnabled } from '@crowd/feature-flags'

import { svc } from '../main'

/*
getMembers is a Temporal activity that retrieves all members available for
enrichment. Member must have one of GitHub username or email address, must not
have been enriched in the past 90 days, and must be part of tenant with a plan
allowing this feature. We limit to 50 members per workflow to not overload
external APIs.
*/
export async function getMembers(): Promise<IMember[]> {
  let rows: IMember[] = []

  try {
    rows = await svc.postgres.reader.connection().query(
      `SELECT
          members."id",
          members."displayName",
          members."attributes",
          members."emails",
          members."contributions",
          members."score",
          members."reach",
          members."tenantId",
          jsonb_object_agg(mi.platform, mi.username) as username
        FROM members
        INNER JOIN tenants ON tenants.id = members."tenantId"
        INNER JOIN "memberIdentities" mi ON mi."memberId" = members.id
        WHERE tenants.plan IN ('Scale', 'Enterprise')
        AND (
          members."lastEnriched" < NOW() - INTERVAL '90 days'
          OR members."lastEnriched" IS NULL
        )
        AND (
          mi.platform = 'github'
          OR array_length(members.emails, 1) > 0
        )
        AND tenants."deletedAt" IS NULL
        AND members."deletedAt" IS NULL
        GROUP BY members.id
        LIMIT 50;`,
    )
  } catch (err) {
    throw new Error(err)
  }

  // Filter rows to only return tenants with this feature flag enabled.
  const members: IMember[] = []
  for (const row of rows) {
    if (
      await isFeatureEnabled(
        FeatureFlag.TEMPORAL_MEMBERS_ENRICHMENT,
        async () => {
          return {
            tenantId: row.tenantId,
          }
        },
        svc.unleash,
      )
    ) {
      members.push(row)
    }
  }

  return members
}
