import { IMember } from '@crowd/types'

import { svc } from '../main'

/*
getMembers is a Temporal activity that retrieves all members available for
enrichment. Member must have one of GitHub username or email address, must not
have been enriched in the past 90 days, and must be part of tenant with a plan
allowing this feature. We limit to 10 members per workflow to not overload
OpenSearch and external APIs, but mostly to not exceed Temporal result size limit.
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
        jsonb_object_agg(mi.platform, mi.username) as username,
        COUNT(activities."memberId") AS activity_count
      FROM members
      INNER JOIN tenants ON tenants.id = members."tenantId"
      INNER JOIN "memberIdentities" mi ON mi."memberId" = members.id
      INNER JOIN activities ON activities."memberId" = members.id
      WHERE tenants.plan IN ('Growth', 'Scale', 'Enterprise')
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
      ORDER BY activity_count DESC
      LIMIT 10;`,
    )
  } catch (err) {
    throw new Error(err)
  }

  return rows
}
