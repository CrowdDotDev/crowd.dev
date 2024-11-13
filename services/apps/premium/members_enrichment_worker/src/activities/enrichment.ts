import { LlmService } from '@crowd/common_services'
import { findMemberIdentityWithTheMostActivityInPlatform as findMemberIdentityWithTheMostActivityInPlatformQuestDb } from '@crowd/data-access-layer/src/activities'
import {
  fetchMemberDataForLLMSquashing,
  findMemberEnrichmentCacheDb,
  findMemberEnrichmentCacheForAllSourcesDb,
  insertMemberEnrichmentCacheDb,
  touchMemberEnrichmentCacheUpdatedAtDb,
  updateMemberEnrichmentCacheDb,
} from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'
import { RedisCache } from '@crowd/redis'
import {
  IEnrichableMemberIdentityActivityAggregate,
  IMemberEnrichmentCache,
  MemberEnrichmentSource,
} from '@crowd/types'

import { EnrichmentSourceServiceFactory } from '../factory'
import { svc } from '../service'
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
  sources: MemberEnrichmentSource[],
  memberId: string,
): Promise<IMemberEnrichmentCache<IMemberEnrichmentData>[]> {
  return findMemberEnrichmentCacheDb(svc.postgres.reader.connection(), memberId, sources)
}

export async function findMemberEnrichmentCacheForAllSources(
  memberId: string,
): Promise<IMemberEnrichmentCache<IMemberEnrichmentData>[]> {
  return findMemberEnrichmentCacheForAllSourcesDb(svc.postgres.reader.connection(), memberId)
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

export async function processMemberSources(
  memberId: string,
  sources: MemberEnrichmentSource[],
): Promise<boolean> {
  svc.log.debug({ memberId }, 'Processing member sources!')

  const toBeSquashed = {}
  // const toBeSquashedContributions = {}
  // find if there's already saved enrichment data in source
  const caches = await findMemberEnrichmentCache(sources, memberId)
  for (const source of sources) {
    const cache = caches.find((c) => c.source === source)
    if (cache && cache.data) {
      const normalized = (await normalizeEnrichmentData(
        source,
        cache.data,
      )) as IMemberEnrichmentDataNormalized

      // TODO uros temp remove contributions from sources to mitigate context size
      // if (Array.isArray(normalized)) {
      //   const normalizedContributions = []
      //   for (const n of normalized) {
      //     if (n.contributions) {
      //       normalizedContributions.push(n.contributions)
      //       delete n.contributions
      //     }
      //   }

      //   toBeSquashedContributions[source] = normalizedContributions
      // } else if (normalized.contributions) {
      //   toBeSquashedContributions[source] = normalized.contributions
      //   delete normalized.contributions
      // }

      toBeSquashed[source] = normalized
    }
  }

  if (Object.keys(toBeSquashed).length > 1) {
    const existingMemberData = await fetchMemberDataForLLMSquashing(svc.postgres.reader, memberId)
    svc.log.info({ memberId }, 'Squashing data for member using LLM!')

    // TODO uros Implement data squasher using LLM & actual member entity enrichment logic

    const llmService = new LlmService(
      svc.postgres.writer,
      {
        accessKeyId: process.env['CROWD_AWS_BEDROCK_ACCESS_KEY_ID'],
        secretAccessKey: process.env['CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY'],
      },
      svc.log,
    )

    const prompt = `
    You are a data consolidation expert specializing in professional profile data.
    Your task is to analyze and merge member data from an existing database with enriched data from multiple sources.

    EXISTING VERIFIED MEMBER DATA:
    ${JSON.stringify(existingMemberData)}

    ENRICHED DATA FROM MULTIPLE SOURCES:
    ${JSON.stringify(toBeSquashed)}

    Your task is to:

    1. IDENTITY VERIFICATION
    - Analyze all provided LinkedIn profiles across sources
    - Mark LinkedIn identities as verified if:
      * They match an existing verified LinkedIn identity, OR
      * The same LinkedIn profile appears in 2+ independent sources
    - Mark LinkedIn identities as unverified if:
      * They appear in only one source, OR
      * Different LinkedIn profiles are found for the same person

    2. DATA CONFIDENCE ASSESSMENT
    For each piece of enriched data, determine confidence level based on:
    - Match with existing verified data
    - Consistency across multiple sources
    - Source reliability (verified identity source > unverified source)
    - Supporting evidence from other identities (email, username patterns)

    3. DATA CONSOLIDATION
    Provide a consolidated profile with:
    - displayName
    - attributes (with sources)
    - identities (with verification status)
    - organizations (with sources)

    RULES:
    1. Prefer data from verified sources over unverified ones
    2. When conflicts exist, prefer data corroborated by multiple sources
    3. For organization histories, preserve all distinct positions with their sources
    4. Maintain provenance for each data point in attributes
    5. Flag any suspicious patterns that might indicate wrong person data
    6. For conflicting data points, include both with confidence indicators
    7. When merging organization data, verify organization identity matches across sources

    Please analyze the provided data and respond with your consolidated results.

    Format your response as a JSON object matching this structure:
    {
      "confidenceScore": number (0-1),
      "consolidatedData": {
        // Match EXISTING VERIFIED MEMBER DATA structure
      },
      "reasoning": {
        "identityVerification": string[],
        "confidenceFactors": string[],
        "conflicts": string[],
        "recommendations": string[]
      }
    }
    Answer with JSON only and nothing else.
    `

    const result = await llmService.consolidateMemberEnrichmentData(memberId, prompt)
    this.log.info({ memberId }, 'LLM result')
  } else {
    svc.log.debug({ memberId }, 'No data to squash for member!')
  }

  return false
}
