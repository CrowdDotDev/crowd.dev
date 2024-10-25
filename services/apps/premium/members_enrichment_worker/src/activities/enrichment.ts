import {
  findMemberEnrichmentCacheDb,
  insertMemberEnrichmentCacheDb,
  touchMemberEnrichmentCacheUpdatedAtDb,
  updateMemberEnrichmentCacheDb,
} from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'
import { IMemberEnrichmentCache, MemberEnrichmentSource } from '@crowd/types'

import { EnrichmentSourceServiceFactory } from '../factory'
import { svc } from '../main'
import {
  IEnrichmentSourceInput,
  IMemberEnrichmentData,
  IMemberEnrichmentDataNormalized,
} from '../types'

export async function isEnrichableBySource(
  source: MemberEnrichmentSource,
  input: IEnrichmentSourceInput,
): Promise<boolean> {
  const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(source, svc.log)
  // TODO: after enrichableBy this function became redundant. Use enrichableBy field to calculate this instead.
  return service.isEnrichableBySource(input)
}

export async function getEnrichmentData(
  source: MemberEnrichmentSource,
  input: IEnrichmentSourceInput,
): Promise<IMemberEnrichmentData | null> {
  const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(source, svc.log)
  return service.getData(input)
}

export async function normalizeEnrichmentData(
  source: MemberEnrichmentSource,
  data: IMemberEnrichmentData,
): Promise<IMemberEnrichmentDataNormalized> {
  const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(source, svc.log)
  return service.normalize(data)
}

export async function isCacheObsolete(
  source: MemberEnrichmentSource,
  cache: IMemberEnrichmentCache<IMemberEnrichmentData>,
): Promise<boolean> {
  const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(source, svc.log)
  return (
    !cache ||
    Date.now() - new Date(cache.updatedAt).getTime() > 1000 * service.cacheObsoleteAfterSeconds
  )
}

export async function findMemberEnrichmentCache(
  source: MemberEnrichmentSource,
  memberId: string,
): Promise<IMemberEnrichmentCache<IMemberEnrichmentData>> {
  return findMemberEnrichmentCacheDb(svc.postgres.reader.connection(), memberId, source)
}

export async function insertMemberEnrichmentCache(
  source: MemberEnrichmentSource,
  memberId: string,
  data: IMemberEnrichmentData,
): Promise<void> {
  await insertMemberEnrichmentCacheDb(svc.postgres.writer.connection(), data, memberId, source)
}

export async function updateMemberEnrichmentCache(
  source: MemberEnrichmentSource,
  memberId: string,
  data: IMemberEnrichmentData,
): Promise<void> {
  await updateMemberEnrichmentCacheDb(svc.postgres.writer.connection(), data, memberId, source)
}

export async function touchMemberEnrichmentCacheUpdatedAt(
  source: MemberEnrichmentSource,
  memberId: string,
): Promise<void> {
  await touchMemberEnrichmentCacheUpdatedAtDb(svc.postgres.writer.connection(), memberId, source)
}
