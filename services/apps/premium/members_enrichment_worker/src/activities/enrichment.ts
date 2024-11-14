import { LlmService } from '@crowd/common_services'
import { updateMemberAttributes } from '@crowd/data-access-layer'
import { findMemberIdentityWithTheMostActivityInPlatform as findMemberIdentityWithTheMostActivityInPlatformQuestDb } from '@crowd/data-access-layer/src/activities'
import {
  updateVerifiedFlag,
  upsertMemberIdentity,
} from '@crowd/data-access-layer/src/member_identities'
import {
  fetchMemberDataForLLMSquashing,
  findMemberEnrichmentCacheDb,
  findMemberEnrichmentCacheForAllSourcesDb,
  insertMemberEnrichmentCacheDb,
  insertWorkExperience,
  touchMemberEnrichmentCacheUpdatedAtDb,
  updateLastEnrichedDate,
  updateMemberEnrichmentCacheDb,
} from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'
import { findOrCreateOrganization } from '@crowd/data-access-layer/src/organizations'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { RedisCache } from '@crowd/redis'
import {
  IEnrichableMemberIdentityActivityAggregate,
  IMemberEnrichmentCache,
  MemberEnrichmentSource,
  MemberIdentityType,
  OrganizationAttributeSource,
  OrganizationIdentityType,
  OrganizationSource,
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

  // without contributions since they take a lot of space
  const toBeSquashed = {}

  // just the contributions if we need them later on
  const toBeSquashedContributions = {}

  // find if there's already saved enrichment data in source
  const caches = await findMemberEnrichmentCache(sources, memberId)
  for (const source of sources) {
    const cache = caches.find((c) => c.source === source)
    if (cache && cache.data) {
      const normalized = (await normalizeEnrichmentData(
        source,
        cache.data,
      )) as IMemberEnrichmentDataNormalized

      if (Array.isArray(normalized)) {
        const normalizedContributions = []
        for (const n of normalized) {
          if (n.contributions) {
            normalizedContributions.push(n.contributions)
            delete n.contributions
          }

          if (n.reach) {
            delete n.reach
          }
        }

        toBeSquashedContributions[source] = normalizedContributions
      }

      if (normalized.contributions) {
        toBeSquashedContributions[source] = normalized.contributions
        delete normalized.contributions
      }

      if (normalized.reach) {
        delete normalized.reach
      }

      toBeSquashed[source] = normalized
    }
  }

  if (Object.keys(toBeSquashed).length > 1) {
    const existingMemberData = await fetchMemberDataForLLMSquashing(svc.postgres.reader, memberId)
    svc.log.info({ memberId }, 'Squashing data for member using LLM!')

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

EXISTING_VERIFIED_MEMBER_DATA:
${JSON.stringify(existingMemberData)}

ENRICHED_DATA:
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
- For member identities:
  * Only include identities with type "username" or "email"
  * Only include highest confidence identities (verified or multi-source)
  * Prioritize professional identities (LinkedIn, GitHub) over social ones
- For organization identities:
  * Only include identities with types: "email", "affiliated-profile", "primary-domain", "username", "alternative-domain"
  * Exclude any organizations without valid identity types
- For attributes:
  * Only include attributes with clear evidence from multiple sources
  * Prioritize professional attributes (title, location, skills) over others
- For organizations:
  * Sort by dateStart descending and include most recent first
  * Only include organizations with strong evidence of connection
  * Stop adding organizations if response size getting too large

Format your response as a JSON object matching this structure:
{
  "confidence": number (0-1),
  "changes": {
    "displayName": string,
    "identities": {
      "update": [  // updates to existing identities
        {
          "t": string, // type: must be one of ${Object.values(MemberIdentityType).join(', ')}
          "v": string, // for value
          "p": string, // for platform
          "ve": boolean // new verification status
        }
      ],
      "new": [  // completely new identities
        {
          "t": string, // type: must be one of ${Object.values(MemberIdentityType).join(', ')}
          "v": string, // for value
          "p": string, // for platform
          "ve": boolean // new verification status
        }
      ]
    },
    "attributes": {
      "update": {  // updates to existing attributes
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
    "organizations": {
      "newConns": [  // new connections to existing organizations
        {
          "orgId": string, // for organizationId - MUST match an existing organizationId from organizations array in EXISTING_VERIFIED_MEMBER_DATA. If organizations array is empty, newConns must be empty
          "t": string, // for title
          "ds": string, // for dateStart
          "de": string, // for dateEnd
          "s": string // for source
        }
      ],
      "newOrgs": [  // completely new organizations to create when no match found in EXISTING_VERIFIED_MEMBER_DATA organizations array
        {
          "n": string, // for org name
          "i": [ // identities - must only include supported types and also must include at least one verified identity
            {
              "t": string, // type: must be one of ${Object.values(OrganizationIdentityType).join(', ')}
              "v": string, // for value
              "p": string, // for platform
              "ve": boolean // new verification status
            }
          ],
          "conn": {
            "t": string, // for title
            "ds": string, // for dateStart
            "de": string, // for dateEnd
            "s": string // for source: must be one of ${Object.values(OrganizationSource).join(', ')}
          }
        }
      ]
    }
  }
}

CRITICAL VALIDATION RULES:
1. Member identities MUST ONLY have type ${Object.values(MemberIdentityType).join(', ')}
2. Organization identities MUST ONLY have types: ${Object.values(OrganizationIdentityType).join(', ')}
3. Organization sources MUST ONLY have sources: ${Object.values(OrganizationSource).join(', ')}
4. Exclude any identities or organizations that don't meet these type restrictions
5. newConns array must ONLY contain connections to organizations that exist in EXISTING_VERIFIED_MEMBER_DATA organizations array
6. If EXISTING_VERIFIED_MEMBER_DATA organizations array is empty, newConns must be empty array
7. Any organization not found in EXISTING_VERIFIED_MEMBER_DATA organizations array must go into newOrgs

If you find you cannot fit all high-confidence data in the response:
1. First omit lower confidence attributes
2. Then omit unverified identities
3. Then omit older organizations
4. Finally, only return the most essential and recent data points

Answer with JSON only and nothing else. Ensure the response is complete and valid JSON.
`

    const data = await llmService.consolidateMemberEnrichmentData(memberId, prompt)

    if (data.result.confidence >= 0.85) {
      svc.log.info({ memberId }, 'LLM returned data with high confidence!')
      await svc.postgres.writer.transactionally(async (tx) => {
        const qx = dbStoreQx(tx)
        const promises = []

        // process attributes
        let update = false
        let attributes = existingMemberData.attributes

        if (data.result.changes.attributes) {
          if (data.result.changes.attributes.update) {
            attributes = { ...attributes, ...data.result.changes.attributes.update }
            update = true
          }

          if (data.result.changes.attributes.new) {
            attributes = { ...attributes, ...data.result.changes.attributes.new }
            update = true
          }
        }

        if (update) {
          svc.log.info({ memberId }, 'Updating member attributes!')
          promises.push(updateMemberAttributes(qx, memberId, attributes))
        }

        // process identities
        if (data.result.changes.identities) {
          const identityTypes = Object.values(MemberIdentityType)

          if (data.result.changes.identities.update) {
            for (const toUpdate of data.result.changes.identities.update) {
              if (identityTypes.includes(toUpdate.t as MemberIdentityType)) {
                svc.log.info({ memberId, toUpdate }, 'Updating verified flag for identity!')
                promises.push(
                  updateVerifiedFlag(qx, {
                    memberId,
                    tenantId: existingMemberData.tenantId,
                    platform: toUpdate.p,
                    type: toUpdate.t as MemberIdentityType,
                    value: toUpdate.v,
                    verified: toUpdate.ve,
                  }),
                )
              } else {
                svc.log.warn({ memberId, toUpdate }, 'Unknown identity type!')
              }
            }
          }

          if (data.result.changes.identities.new) {
            for (const toAdd of data.result.changes.identities.new) {
              if (identityTypes.includes(toAdd.t as MemberIdentityType)) {
                svc.log.info({ memberId, toAdd }, 'Adding new identity!')
                promises.push(
                  upsertMemberIdentity(qx, {
                    memberId,
                    tenantId: existingMemberData.tenantId,
                    platform: toAdd.p,
                    type: toAdd.t as MemberIdentityType,
                    value: toAdd.v,
                    verified: toAdd.ve,
                  }),
                )
              } else {
                svc.log.warn({ memberId, toAdd }, 'Unknown identity type!')
              }
            }
          }
        }

        // process organizations
        if (data.result.changes.organizations) {
          const sources = Object.values(OrganizationSource)

          if (data.result.changes.organizations.newConns) {
            for (const conn of data.result.changes.organizations.newConns) {
              if (sources.includes(conn.s as OrganizationSource)) {
                svc.log.info({ memberId, conn }, 'Adding new connection to existing organization!')
                promises.push(
                  insertWorkExperience(
                    tx.transaction(),
                    memberId,
                    conn.orgId,
                    conn.t,
                    conn.ds,
                    conn.de,
                    conn.s as OrganizationSource,
                  ),
                )
              } else {
                svc.log.warn({ memberId, conn }, 'Unknown organization source!')
              }
            }
          }

          if (data.result.changes.organizations.newOrgs) {
            for (const org of data.result.changes.organizations.newOrgs) {
              svc.log.info({ memberId, org }, 'Adding new organization!')
              promises.push(
                findOrCreateOrganization(
                  qx,
                  existingMemberData.tenantId,
                  OrganizationAttributeSource.ENRICHMENT,
                  {
                    displayName: org.n,
                    identities: org.i.map((i) => {
                      return {
                        type: i.t as OrganizationIdentityType,
                        platform: i.p,
                        value: i.v,
                        verified: i.ve,
                      }
                    }),
                  },
                ).then((orgId) =>
                  insertWorkExperience(
                    tx.transaction(),
                    memberId,
                    orgId,
                    org.conn.t,
                    org.conn.ds,
                    org.conn.de,
                    org.conn.s as OrganizationSource,
                  ),
                ),
              )
            }
          }
        }

        // also touch members.lastEnriched date
        promises.push(
          updateLastEnrichedDate(tx.transaction(), memberId, existingMemberData.tenantId),
        )

        await Promise.all(promises)
      })

      svc.log.debug({ memberId }, 'Member sources processed successfully!')
      return true
    } else {
      svc.log.warn({ memberId }, 'LLM returned data with low confidence!')
    }
  } else {
    svc.log.warn({ memberId }, 'No data to squash for member!')
  }

  return false
}
