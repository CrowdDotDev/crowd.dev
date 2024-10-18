import axios from 'axios'

import { MemberEnrichmentSource } from '@crowd/types'
import { IEnrichmentData, IEnrichmentDataNormalized, IEnrichmentSourceInput } from '../types'
import { EnrichmentSourceServiceFactory } from '../factory'
import { svc } from '../main'
import {
  findMemberEnrichmentCacheDb,
  insertMemberEnrichmentCacheDb,
} from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'
import { IMemberEnrichmentCache } from '@crowd/types/src/premium'

export async function getEnrichmentData(
  source: MemberEnrichmentSource,
  input: IEnrichmentSourceInput,
): Promise<IEnrichmentData> {
  const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(source, svc.log)
  return service.getData(input)
}

export async function normalizeEnrichmentData(
  source: MemberEnrichmentSource,
  data: IEnrichmentData,
): Promise<IEnrichmentDataNormalized> {
  const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(source, svc.log)
  return service.normalize(data)
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
