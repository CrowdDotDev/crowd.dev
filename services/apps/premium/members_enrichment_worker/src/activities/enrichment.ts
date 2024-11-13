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

Your task is to return ONLY THE CHANGES needed to update the existing member data.

1. IDENTITY VERIFICATION RULES
- Mark LinkedIn identities as verified if:
  * They match an existing verified LinkedIn identity, OR
  * The same LinkedIn profile appears in 2+ independent sources
- Mark LinkedIn identities as unverified if:
  * They appear in only one source, OR
  * Different LinkedIn profiles are found for the same person

2. DATA CONSOLIDATION RULES
- For identities:
  * Update verification status of existing identities when appropriate
  * Add new identities not present in existing data
- For attributes:
  * Add new sources/values to existing attributes
  * Create new attributes when not present in existing data
  * Update 'default' value only when high confidence (e.g., verified LinkedIn data)
- For organizations:
  * Match with existing organizations where possible using organization identities
  * Create new organizations only when no match found
  * Include source attribution

Format your response as a JSON object matching this structure:
{
  "confidenceScore": number (0-1),
  "changes": {
    "displayName": string | null,  // null if no change needed
    "identityChanges": {
      "updateExisting": [  // updates to existing identities
        {
          "type": string,
          "value": string,
          "platform": string,
          "verified": boolean  // new verification status
        }
      ],
      "new": [  // completely new identities
        {
          "type": string,
          "value": string,
          "platform": string,
          "verified": boolean
        }
      ]
    },
    "attributeChanges": {
      "updateExisting": {  // updates to existing attributes
        [attributeName: string]: {
          "default"?: any,  // include only if default value should change
          [source: string]: any  // only new sources to add
        }
      },
      "new": {  // completely new attributes
        [attributeName: string]: {
          "default": any,  // required for new attributes
          [source: string]: any
        }
      }
    },
    "organizationChanges": {
      "newConnections": [  // new connections to existing organizations
        {
          "organizationId": string,
          "title": string,
          "dateStart": string,
          "dateEnd": string,
          "source": string
        }
      ],
      "newOrganizations": [  // completely new organizations to create
        {
          "name": string,
          "identities": [
            {
              "type": string,
              "value": string,
              "platform": string,
              "verified": boolean
            }
          ],
          "connection": {
            "title": string,
            "dateStart": string,
            "dateEnd": string,
            "source": string
          }
        }
      ]
    }
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
    svc.log.info({ memberId }, 'LLM result')
  } else {
    svc.log.debug({ memberId }, 'No data to squash for member!')
  }

  return false
}
