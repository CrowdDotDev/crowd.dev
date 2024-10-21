import axios from 'axios'

import { MemberEnrichmentSource } from '@crowd/types'
import {
  IMemberEnrichmentData,
  IMemberEnrichmentDataNormalized,
  IEnrichmentSourceInput,
} from '../types'
import { EnrichmentSourceServiceFactory } from '../factory'
import { svc } from '../main'
import {
  findMemberEnrichmentCacheDb,
  insertMemberEnrichmentCacheDb,
  touchMemberEnrichmentCacheUpdatedAtDb,
} from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'
import { IMemberEnrichmentCache } from '@crowd/types/src/premium'

export async function getEnrichmentData(
  source: MemberEnrichmentSource,
  input: IEnrichmentSourceInput,
): Promise<IMemberEnrichmentData> {
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
  cache: IMemberEnrichmentCache,
): Promise<boolean> {
  const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(source, svc.log)
  return (
    !cache ||
    new Date().getTime() - new Date(cache.updatedAt).getTime() >
      1000 * service.cacheObsoleteAfterSeconds
  )
}

export async function findMemberEnrichmentCache(
  source: MemberEnrichmentSource,
  memberId: string,
): Promise<IMemberEnrichmentCache> {
  return findMemberEnrichmentCacheDb(svc.postgres.reader.connection(), memberId, source)
}

export async function insertMemberEnrichmentCache(
  source: MemberEnrichmentSource,
  memberId: string,
  data: unknown,
): Promise<void> {
  await insertMemberEnrichmentCacheDb(svc.postgres.writer.connection(), data, memberId, source)
}

export async function touchMemberEnrichmentCacheUpdatedAt(
  source: MemberEnrichmentSource,
  memberId: string,
): Promise<void> {
  await touchMemberEnrichmentCacheUpdatedAtDb(svc.postgres.writer.connection(), memberId, source)
}
