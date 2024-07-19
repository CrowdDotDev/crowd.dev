import { IMember, FeatureFlag } from '@crowd/types'
import { isFeatureEnabled } from '@crowd/feature-flags'

import { svc } from '../main'
import { fetchMembersForEnrichment } from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'

/*
getMembers is a Temporal activity that retrieves all members available for
enrichment. Member must have one of GitHub username or email address, must not
have been enriched in the past 90 days, and must be part of tenant with a plan
allowing this feature. We limit to 50 members per workflow to not overload
external APIs.
*/
export async function getMembers(alsoUseEmailIdentitiesForEnrichment: boolean): Promise<IMember[]> {
  let rows: IMember[] = []

  try {
    const db = svc.postgres.reader
    rows = await fetchMembersForEnrichment(db, alsoUseEmailIdentitiesForEnrichment)
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
