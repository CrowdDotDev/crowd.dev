import { fetchMembersForEnrichment } from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'
import {
  IEnrichableMember,
  IMemberEnrichmentSourceQueryInput,
  MemberEnrichmentSource,
} from '@crowd/types'

import { EnrichmentSourceServiceFactory } from '../factory'
import { svc } from '../main'

export async function getEnrichableMembers(
  limit: number,
  sources: MemberEnrichmentSource[],
  afterCursor: { activityCount: number; memberId: string } | null,
): Promise<IEnrichableMember[]> {
  let rows: IEnrichableMember[] = []
  const sourceInputs: IMemberEnrichmentSourceQueryInput[] = sources.map((s) => {
    const srv = EnrichmentSourceServiceFactory.getEnrichmentSourceService(s, svc.log)
    return {
      source: s,
      cacheObsoleteAfterSeconds: srv.cacheObsoleteAfterSeconds,
      enrichableBySql: srv.enrichableBySql,
    }
  })
  const db = svc.postgres.reader
  rows = await fetchMembersForEnrichment(db, limit, sourceInputs, afterCursor)

  return rows
}
