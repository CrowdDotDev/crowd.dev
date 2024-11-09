import { fetchMembersForEnrichment } from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'
import {
  IEnrichableMember,
  IMemberEnrichmentSourceQueryInput,
  MemberEnrichmentSource,
} from '@crowd/types'

import { EnrichmentSourceServiceFactory } from '../factory'
import { svc } from '../main'
import { IEnrichmentService } from '../types'

import { getEnrichmentInput } from './enrichment'

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

export async function getMaxConcurrentRequests(
  members: IEnrichableMember[],
  possibleSources: MemberEnrichmentSource[],
): Promise<number> {
  const serviceMap: Partial<Record<MemberEnrichmentSource, IEnrichmentService>> = {}
  const distinctEnrichableSources = new Set<MemberEnrichmentSource>()

  for (const source of possibleSources) {
    serviceMap[source] = EnrichmentSourceServiceFactory.getEnrichmentSourceService(source, svc.log)
  }
  for (const member of members) {
    const enrichmentInput = await getEnrichmentInput(member)
    Object.keys(serviceMap).forEach(async (source) => {
      if (await serviceMap[source].isEnrichableBySource(enrichmentInput)) {
        distinctEnrichableSources.add(source as MemberEnrichmentSource)
      }
    })
  }

  let smallestMaxConcurrentRequests = Infinity

  Array.from(distinctEnrichableSources).forEach(async (source) => {
    smallestMaxConcurrentRequests = Math.min(
      smallestMaxConcurrentRequests,
      serviceMap[source].maxConcurrentRequests,
    )
  })

  svc.log.info('Setting max concurrent requests', { smallestMaxConcurrentRequests })

  return smallestMaxConcurrentRequests
}
