import { findMemberIdentityWithTheMostActivityInPlatform as findMemberIdentityWithTheMostActivityInPlatformQuestDb } from '@crowd/data-access-layer/src/activities'
import {
  findMemberEnrichmentCacheDb,
  findMemberEnrichmentCacheForAllSourcesDb,
  insertMemberEnrichmentCacheDb,
  touchMemberEnrichmentCacheUpdatedAtDb,
  updateMemberEnrichmentCacheDb,
} from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'
import { refreshMaterializedView } from '@crowd/data-access-layer/src/utils'
import { RedisCache } from '@crowd/redis'
import {
  IEnrichableMember,
  IEnrichableMemberIdentityActivityAggregate,
  IMemberEnrichmentCache,
  MemberEnrichmentSource,
  MemberIdentityType,
  PlatformType,
} from '@crowd/types'

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
  return service.isEnrichableBySource(input)
}

export async function getEnrichmentData(
  source: MemberEnrichmentSource,
  input: IEnrichmentSourceInput,
): Promise<IMemberEnrichmentData | null> {
  const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(source, svc.log)
  if ((await service.isEnrichableBySource(input)) && (await hasRemainingCredits(source))) {
    return service.getData(input)
  }
  return null
}

export async function getEnrichmentInput(
  input: IEnrichableMember,
): Promise<IEnrichmentSourceInput> {
  const enrichmentInput: IEnrichmentSourceInput = {
    memberId: input.id,
    email: input.identities.find((i) => i.verified && i.type === MemberIdentityType.EMAIL),
    linkedin: input.identities.find(
      (i) =>
        i.verified &&
        i.platform === PlatformType.LINKEDIN &&
        i.type === MemberIdentityType.USERNAME,
    ),
    displayName: input.displayName || undefined,
    website: input.website || undefined,
    location: input.location || undefined,
    activityCount: input.activityCount || 0,
  }

  // there can be multiple verified identities in github, we select the one with the most activities
  const verifiedGithubIdentities = input.identities.filter(
    (i) =>
      i.verified && i.platform === PlatformType.GITHUB && i.type === MemberIdentityType.USERNAME,
  )

  if (verifiedGithubIdentities.length > 1) {
    const ghIdentityWithTheMostActivities = await findMemberIdentityWithTheMostActivityInPlatform(
      input.id,
      PlatformType.GITHUB,
    )
    if (ghIdentityWithTheMostActivities) {
      enrichmentInput.github = input.identities.find(
        (i) =>
          i.verified &&
          i.platform === PlatformType.GITHUB &&
          i.type === MemberIdentityType.USERNAME &&
          i.value === ghIdentityWithTheMostActivities.username,
      )
    }
  } else {
    enrichmentInput.github = verifiedGithubIdentities?.[0] || undefined
  }

  return enrichmentInput
}

export async function normalizeEnrichmentData(
  source: MemberEnrichmentSource,
  data: IMemberEnrichmentData,
): Promise<IMemberEnrichmentDataNormalized | IMemberEnrichmentDataNormalized[]> {
  const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(source, svc.log)
  return service.normalize(data)
}

export async function isCacheObsolete(
  source: MemberEnrichmentSource,
  cache: IMemberEnrichmentCache<IMemberEnrichmentData>,
): Promise<boolean> {
  return isCacheObsoleteSync(source, cache)
}

export function isCacheObsoleteSync(
  source: MemberEnrichmentSource,
  cache: IMemberEnrichmentCache<IMemberEnrichmentData>,
): boolean {
  const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(source, svc.log)
  return (
    !cache ||
    Date.now() - new Date(cache.updatedAt).getTime() > 1000 * service.cacheObsoleteAfterSeconds
  )
}

export async function setHasRemainingCredits(
  source: MemberEnrichmentSource,
  hasCredits: boolean,
): Promise<void> {
  const redisCache = new RedisCache(`enrichment-${source}`, svc.redis, svc.log)
  if (hasCredits) {
    await redisCache.set('hasRemainingCredits', 'true', 60)
  } else {
    await redisCache.set('hasRemainingCredits', 'false', 60)
  }
}

export async function getHasRemainingCredits(source: MemberEnrichmentSource): Promise<boolean> {
  const redisCache = new RedisCache(`enrichment-${source}`, svc.redis, svc.log)
  return (await redisCache.get('hasRemainingCredits')) === 'true'
}

export async function hasRemainingCreditsExists(source: MemberEnrichmentSource): Promise<boolean> {
  const redisCache = new RedisCache(`enrichment-${source}`, svc.redis, svc.log)
  return await redisCache.exists('hasRemainingCredits')
}

export async function hasRemainingCredits(source: MemberEnrichmentSource): Promise<boolean> {
  const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(source, svc.log)

  if (await hasRemainingCreditsExists(source)) {
    return getHasRemainingCredits(source)
  }

  const hasCredits = await service.hasRemainingCredits()

  await setHasRemainingCredits(source, hasCredits)
  return hasCredits
}

export async function findMemberEnrichmentCache(
  source: MemberEnrichmentSource,
  memberId: string,
): Promise<IMemberEnrichmentCache<IMemberEnrichmentData>> {
  return findMemberEnrichmentCacheDb(svc.postgres.reader.connection(), memberId, source)
}

export async function findMemberEnrichmentCacheForAllSources(
  memberId: string,
  returnRowsWithoutData = false,
): Promise<IMemberEnrichmentCache<IMemberEnrichmentData>[]> {
  return findMemberEnrichmentCacheForAllSourcesDb(
    svc.postgres.reader.connection(),
    memberId,
    returnRowsWithoutData,
  )
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

export async function findMemberIdentityWithTheMostActivityInPlatform(
  memberId: string,
  platform: string,
): Promise<IEnrichableMemberIdentityActivityAggregate> {
  return findMemberIdentityWithTheMostActivityInPlatformQuestDb(svc.questdbSQL, memberId, platform)
}

export async function getObsoleteSourcesOfMember(
  memberId: string,
  possibleSources: MemberEnrichmentSource[],
): Promise<MemberEnrichmentSource[]> {
  const caches = await findMemberEnrichmentCacheForAllSources(memberId, true)
  const obsoleteSources = possibleSources.filter((source) =>
    isCacheObsoleteSync(
      source,
      caches.find((s) => s.source === source),
    ),
  )
  return obsoleteSources
}

export async function refreshMemberEnrichmentMaterializedView(mvName: string): Promise<void> {
  await refreshMaterializedView(svc.postgres.writer.connection(), mvName)
}
