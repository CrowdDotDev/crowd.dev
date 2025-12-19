import { MemberField, findMemberById, pgpQx } from '@crowd/data-access-layer'
import { fetchMembersForEnrichment } from '@crowd/data-access-layer/src/old/apps/members_enrichment_worker'
import {
  IEnrichableMember,
  IEnrichmentSourceQueryInput,
  MemberEnrichmentSource,
} from '@crowd/types'

import { EnrichmentSourceServiceFactory } from '../factory'
import { svc } from '../service'
import { IEnrichmentService } from '../types'

export async function getEnrichableMembers(
  limit: number,
  sources: MemberEnrichmentSource[],
): Promise<IEnrichableMember[]> {
  const sourceInputs: IEnrichmentSourceQueryInput<MemberEnrichmentSource>[] = sources.map((s) => {
    const srv = EnrichmentSourceServiceFactory.getEnrichmentSourceService(s, svc.log)
    return {
      source: s,
      cacheObsoleteAfterSeconds: srv.cacheObsoleteAfterSeconds,
      enrichableBySql: srv.enrichableBySql,
    }
  })

  return fetchMembersForEnrichment(svc.postgres.reader, limit, sourceInputs)
}

// Get the most strict parallelism among existing and enrichable sources
// We only check sources that has activity count cutoff in current range
export async function getMaxConcurrentRequests(
  members: IEnrichableMember[],
  possibleSources: MemberEnrichmentSource[],
  concurrencyLimit: number,
): Promise<number> {
  const serviceMap: Partial<Record<MemberEnrichmentSource, IEnrichmentService>> = {}
  const currentProcessingActivityCount = members[0].activityCount

  let maxConcurrentRequestsInAllSources = concurrencyLimit

  for (const source of possibleSources) {
    serviceMap[source] = EnrichmentSourceServiceFactory.getEnrichmentSourceService(source, svc.log)
    const activityCountCutoff = serviceMap[source].enrichMembersWithActivityMoreThan
    if (!activityCountCutoff || activityCountCutoff <= currentProcessingActivityCount) {
      maxConcurrentRequestsInAllSources = Math.min(
        maxConcurrentRequestsInAllSources,
        serviceMap[source].maxConcurrentRequests,
      )
    }
  }
  svc.log.info('Setting max concurrent requests', { maxConcurrentRequestsInAllSources })

  return maxConcurrentRequestsInAllSources
}

export async function getMemberById(memberId: string): Promise<boolean> {
  const qx = pgpQx(svc.postgres.reader.connection())
  const member = await findMemberById(qx, memberId, [MemberField.ID])
  return !!member
}
