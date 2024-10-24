import { IMember, MemberEnrichmentSource } from '@crowd/types'

import { svc } from '../main'
import { fetchMembersForEnrichment } from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'
import { EnrichmentSourceServiceFactory } from '../factory'
import { IMemberEnrichmentSourceQueryInput } from '@crowd/types/src/premium'

/*
getMembers is a Temporal activity that retrieves all members available for
enrichment. Member must have one of GitHub username or email address, must not
have been enriched in the past 90 days, and must be part of tenant with a plan
allowing this feature. We limit to 50 members per workflow to not overload
external APIs.
*/
export async function getMembers(
  limit: number,
  sources: MemberEnrichmentSource[],
  afterId: string,
): Promise<IMember[]> {
  let rows: IMember[] = []
  const sourceInputs: IMemberEnrichmentSourceQueryInput[] = sources.map((s) => {
    const srv = EnrichmentSourceServiceFactory.getEnrichmentSourceService(s, svc.log)
    return {
      source: s,
      cacheObsoleteAfterSeconds: srv.cacheObsoleteAfterSeconds,
      enrichableBy: srv.enrichableBy,
    }
  })
  try {
    const db = svc.postgres.reader
    rows = await fetchMembersForEnrichment(db, limit, sourceInputs, afterId)
  } catch (err) {
    throw new Error(err)
  }

  return rows
}
