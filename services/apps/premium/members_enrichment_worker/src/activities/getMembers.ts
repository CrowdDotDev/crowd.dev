import { IMember } from '@crowd/types'

import { svc } from '../main'
import { fetchMembersForEnrichment } from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'

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
    const db = svc.postgres.reader
    rows = await fetchMembersForEnrichment(db)
  } catch (err) {
    throw new Error(err)
  }

  return rows
}
