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
import { refreshMaterializedView } from '@crowd/data-access-layer/src/utils'
import { RedisCache } from '@crowd/redis'
import {
  IEnrichableMember,
  IEnrichableMemberIdentityActivityAggregate,
  IMemberEnrichmentCache,
  IMemberOriginalData,
  MemberEnrichmentSource,
  MemberIdentityType,
  OrganizationAttributeSource,
  OrganizationIdentityType,
  OrganizationSource,
  PlatformType,
} from '@crowd/types'

import { EnrichmentSourceServiceFactory } from '../factory'
import { svc } from '../service'
import {
  IEnrichmentSourceInput,
  IMemberEnrichmentData,
  IMemberEnrichmentDataNormalized,
  IMemberEnrichmentDataNormalizedOrganization,
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
  sources: MemberEnrichmentSource[],
  memberId: string,
): Promise<IMemberEnrichmentCache<IMemberEnrichmentData>[]> {
  return findMemberEnrichmentCacheDb(svc.postgres.reader.connection(), memberId, sources)
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

    let progaiLinkedinScraperProfileSelected: IMemberEnrichmentDataNormalized = null
    let crustDataProfileSelected: IMemberEnrichmentDataNormalized = null

    if (toBeSquashed[MemberEnrichmentSource.CRUSTDATA]) {
      crustDataProfileSelected = await findWhichLinkedinProfileToUseAmongScraperResult(
        memberId,
        existingMemberData,
        toBeSquashed[MemberEnrichmentSource.CRUSTDATA],
      )
      toBeSquashed[MemberEnrichmentSource.CRUSTDATA] = crustDataProfileSelected
    }

    if (toBeSquashed[MemberEnrichmentSource.PROGAI_LINKEDIN_SCRAPER]) {
      progaiLinkedinScraperProfileSelected = await findWhichLinkedinProfileToUseAmongScraperResult(
        memberId,
        existingMemberData,
        toBeSquashed[MemberEnrichmentSource.PROGAI_LINKEDIN_SCRAPER],
      )
      toBeSquashed[MemberEnrichmentSource.PROGAI_LINKEDIN_SCRAPER] =
        progaiLinkedinScraperProfileSelected
    }

    // start squashing the data
    const squashedPayload: IMemberEnrichmentDataNormalized = {
      identities: [],
      attributes: {},
      memberOrganizations: [],
    }

    // 1) squash identities
    for (const source of Object.keys(toBeSquashed)) {
      if (toBeSquashed[source].identities) {
        for (const identity of toBeSquashed[source].identities) {
          // check if identity already exists, if not add it to squashedPayload
          if (
            !squashedPayload.identities.find(
              (i) =>
                i.platform === identity.platform &&
                i.type === identity.type &&
                i.value === identity.value,
            ) &&
            // check in member data as well
            !existingMemberData.identities.find(
              (i) =>
                i.platform === identity.platform &&
                i.type === identity.type &&
                i.value === identity.value,
            )
          ) {
            // prevent adding linkedin identities to squashed payload that was discarded by the LLM
            if (
              identity.platform === PlatformType.LINKEDIN &&
              !crustDataProfileSelected.identities.some((i) => i.value === identity.value) &&
              !progaiLinkedinScraperProfileSelected.identities.some(
                (i) => i.value === identity.value,
              )
            ) {
              continue
            }

            squashedPayload.identities.push(identity)
          }
        }
      }
    }

    const attributesSquashed = {}
    const attributeCountMap = {}
    const attributeValues = {}

    // 2) squash attributes
    for (const source of Object.keys(toBeSquashed)) {
      if (toBeSquashed[source].attributes) {
        for (const attribute of Object.keys(toBeSquashed[source].attributes)) {
          if (toBeSquashed[source].attributes[attribute][`enrichment-${source}`]) {
            if (attributeCountMap[attribute]) {
              attributeCountMap[attribute] = attributeCountMap[attribute] + 1
              delete attributesSquashed[attribute]
              attributeValues[attribute].push(
                toBeSquashed[source].attributes[attribute][`enrichment-${source}`],
              )
            } else {
              attributeCountMap[attribute] = 1
              attributesSquashed[attribute] = {
                enrichment: toBeSquashed[source].attributes[attribute][`enrichment-${source}`],
              }
              attributeValues[attribute] = [
                toBeSquashed[source].attributes[attribute][`enrichment-${source}`],
              ]
            }
          }
        }
      }
    }

    const llmInputAttributes = {}

    for (const attribute of Object.keys(attributeCountMap)) {
      if (attributeCountMap[attribute] == 1) {
        attributesSquashed[attribute] = {
          enrichment: attributeValues[attribute],
        }
      } else {
        llmInputAttributes[attribute] = attributeValues[attribute]
      }
    }

    if (Object.keys(llmInputAttributes).length > 0) {
      // ask LLM to select from multiple values in different sources for the same attribute
      const multipleValueAttributesSquashed = await squashMultipleValueAttributesWithLLM(
        memberId,
        llmInputAttributes,
      )

      for (const attribute of Object.keys(multipleValueAttributesSquashed)) {
        if (multipleValueAttributesSquashed[attribute]) {
          attributesSquashed[attribute] = {
            enrichment: multipleValueAttributesSquashed[attribute],
          }
        }
      }
    }

    squashedPayload.attributes = attributesSquashed

    // 3) squash work experiences
    if (crustDataProfileSelected) {
      squashedPayload.memberOrganizations = crustDataProfileSelected.memberOrganizations
    } else {
      // check if there are multiple work experiences from different sources
      const workExperienceDataInDifferentSources = []
      for (const source of Object.keys(toBeSquashed)) {
        if (
          toBeSquashed[source].memberOrganizations &&
          toBeSquashed[source].memberOrganizations.length > 0
        ) {
          workExperienceDataInDifferentSources.push(toBeSquashed[source].memberOrganizations)
        }
      }

      if (workExperienceDataInDifferentSources.length == 0) {
        squashedPayload.memberOrganizations = []
      } else if (workExperienceDataInDifferentSources.length == 1) {
        squashedPayload.memberOrganizations = workExperienceDataInDifferentSources[0]
      } else {
        const workExperiencesSquashedByLLM = await squashWorkExperiencesWithLLM(
          memberId,
          workExperienceDataInDifferentSources,
        )
        squashedPayload.memberOrganizations = workExperiencesSquashedByLLM
      }
    }

    console.log('squashedPayload.identities', squashedPayload.identities)
    console.log('squashedPayload.attributes', squashedPayload.attributes)
    console.log('squashedPayload.memberOrganizations', squashedPayload.memberOrganizations)

    /* 
      // TODO:: Here should be adjusted to work with the squashedPayload
      
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
  
        */

    svc.log.debug({ memberId }, 'Member sources processed successfully!')
    return true

    return false
  }
}

export async function getObsoleteSourcesOfMember(
  memberId: string,
  possibleSources: MemberEnrichmentSource[],
): Promise<MemberEnrichmentSource[]> {
  const caches = await findMemberEnrichmentCacheForAllSources(memberId, true)
  const obsoleteSources = possibleSources.filter((source) =>
    isCacheObsoleteSync(
      source,
      caches.find((c) => c.source === source),
    ),
  )
  return obsoleteSources
}

export async function refreshMemberEnrichmentMaterializedView(mvName: string): Promise<void> {
  await refreshMaterializedView(svc.postgres.writer.connection(), mvName)
}

/**
 * Among given profiles, find the one that belongs to the same person as the given member profile.
 * @param memberProfile
 * @param linkedinProfiles
 */
export async function findRelatedLinkedinProfilesWithLLM(
  memberId: string,
  memberProfile: IMemberOriginalData,
  linkedinProfiles: IMemberEnrichmentDataNormalized[],
): Promise<IMemberEnrichmentDataNormalized> {
  const prompt = `
You are an expert at analyzing and matching personal profiles. I will provide you with the details of a member profile and an array of LinkedIn profiles in JSON format. Your task is to analyze the data and return the single LinkedIn profile that most likely belongs to the member, along with an explanation of why it was selected.

Instructions:
    Match the profiles based on flexible criteria, allowing partial matches or similarities.
    Output valid JSON only. The JSON should include the matched profile and an explanation field explaining why it was selected.
    Return the matched profile exactly as it appears in the input JSON array.
    If no match is found, return an object with an empty profile and an explanation describing why no match was made.
Considerations for Matching:
  Name Similarity: Consider at most 2 edit distances, use character tokenization.
  Job Titles and Companies: Look for overlaps in current or past job titles and companies.
  Location: Prioritize profiles with overlapping or similar locations.
  Education and Skills: Check for shared elements in education and skillsets.
  If there are contradictory data, don't return the profile
  If a profile matches at least two strong criterions (e.g., name, job, or location) and has no contradictory information, it is a plausible match.

  ### Member Profile:
    ${JSON.stringify(memberProfile)}

  ### LinkedIn Profiles:
    ${JSON.stringify(linkedinProfiles)}

  
    Expected Output:
    If a match is found:
    {
      "profile": { /* The matched LinkedIn profile as it appears in the input */ },
    }
    
    If no match is found:
    {
      "profile": {},
    }

  Return exactly one profile in valid JSON format.
    If no match is found, return empty object {} in profile.
    Ensure the response is a **valid and complete JSON**.
    DO NOT output anything else.
    Output ONLY valid JSON
  `

  const llmService = new LlmService(
    svc.postgres.writer,
    {
      accessKeyId: process.env['CROWD_AWS_BEDROCK_ACCESS_KEY_ID'],
      secretAccessKey: process.env['CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY'],
    },
    svc.log,
  )

  const result = await llmService.findRelatedLinkedinProfiles(memberId, prompt)
  return result.result
}

/**
 * Squash multiple-value attributes into a single value based on the best criteria.
 * @param memberProfile
 * @param linkedinProfiles
 */
export async function squashMultipleValueAttributesWithLLM(
  memberId: string,
  attributes: {
    [key: string]: any[]
  },
): Promise<{ [key: string]: any }> {
  const prompt = `
      I have an object with attributes structured as follows:
      
      ${JSON.stringify(attributes)}

      The possible attributes include:

      # avatarUrl (string): Represents URLs for user profile pictures.
      # jobTitle (string): Represents job titles or roles.
      # bio (string): Represents user biographies or descriptions.
      # location (string): Represents user locations.
      
      Each attribute has an array of possible values, and the task is to determine the best value for each attribute based on the following criteria:

      For avatarUrl:
        Prefer the URL pointing to the highest-quality, professional, or clear image.
        Exclude any broken or invalid URLs.
      For jobTitle:
        Choose the most precise, specific, and professional title (e.g., "Software Engineer" over "Engineer").
        If job titles indicate a hierarchy, select the one representing the highest level (e.g., "Senior Software Engineer" over "Software Engineer").
      For bio:
        Select the most detailed, relevant, and grammatically accurate description.
        Avoid overly generic or vague descriptions.
      For location:
        Prioritize values that are specific and precise (e.g., "Berlin, Germany" over just "Germany").
        Ensure the location format is complete and includes necessary details (e.g., city and country).
      
      Return the selected values in a structured format like this:
      {
        "avatarUrl": "selectedValue",
        "jobTitle": "selectedValue",
        "bio": "selectedValue",
        "location": "selectedValue"
      }
      Use the provided attributes and their values to make the best possible selection for each attribute, ensuring the choices align with professional, specific, and practical standards.
      Ensure the response is a **valid and complete JSON**.
      DO NOT output anything else.
      Output ONLY valid JSON
  `

  const llmService = new LlmService(
    svc.postgres.writer,
    {
      accessKeyId: process.env['CROWD_AWS_BEDROCK_ACCESS_KEY_ID'],
      secretAccessKey: process.env['CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY'],
    },
    svc.log,
  )

  const result = await llmService.squashMultipleValueAttributes<{ [key: string]: any }>(
    memberId,
    prompt,
  )
  return result.result
}

async function findWhichLinkedinProfileToUseAmongScraperResult(
  memberId: string,
  memberData: IMemberOriginalData,
  profiles: IMemberEnrichmentDataNormalized[],
): Promise<IMemberEnrichmentDataNormalized> {
  let profileSelected: IMemberEnrichmentDataNormalized = null
  const profilesFromVerifiedIdentities: IMemberEnrichmentDataNormalized[] = []
  const profilesFromUnverfiedIdentities: IMemberEnrichmentDataNormalized[] = []

  // ignore linkedin scraper sources, when there's only one source returning linkedin handle
  for (const profile of profiles) {
    if (profile.metadata.isFromVerifiedSource) {
      profilesFromVerifiedIdentities.push(profile)
    } else {
      profilesFromUnverfiedIdentities.push(profile)
    }
  }

  if (profilesFromVerifiedIdentities.length > 0) {
    if (profilesFromVerifiedIdentities.length > 1) {
      // ASK LLM
      const result = await findRelatedLinkedinProfilesWithLLM(
        memberId,
        memberData,
        profilesFromVerifiedIdentities,
      )

      // check if empty object
      if (Object.keys(result).length !== 0) {
        profileSelected = result
      }
    } else {
      profileSelected = profilesFromVerifiedIdentities[0]
    }
  }

  if (!profileSelected && profilesFromUnverfiedIdentities.length > 0) {
    const result = await findRelatedLinkedinProfilesWithLLM(
      memberId,
      memberData,
      profilesFromUnverfiedIdentities,
    )

    // check if empty object
    if (Object.keys(result).length !== 0) {
      profileSelected = result
    }
  }

  return profileSelected
}

async function squashWorkExperiencesWithLLM(
  memberId: string,
  workExperiencesFromMultipleSources: IMemberEnrichmentDataNormalizedOrganization[][],
): Promise<IMemberEnrichmentDataNormalizedOrganization[]> {
  const prompt = `
   
      ## INPUT
      ${JSON.stringify(workExperiencesFromMultipleSources)}

      ## INFORMATION
      You are given an input consisting of nested arrays of normalized organization data (IMemberEnrichmentDataNormalizedOrganization[][]). 
      Each data entry includes the following fields:
        name: The name of the organization.
        identities: An optional array of unique identities for the organization.
        title: An optional job title at the organization.
        organizationDescription: An optional description of the organization.
        startDate: An optional start date for the role (ISO format string).
        endDate: An optional end date for the role (ISO format string, or null if ongoing).
        source: The source of the organization data.
      
      ## OBJECTIVE
      Generate a single, chronologically ordered array of IMemberEnrichmentDataNormalizedOrganization objects that represents the most accurate work experience timeline.

      Guidelines:
        Order Chronologically:
          Sort the roles by startDate. If startDate is missing, infer the order based on available endDate or other contextual data.
        Merge Overlapping Roles:
          If multiple roles from the same organization overlap in time, squash them into one entry with a unified startDate, endDate, and picked information (e.g., job titles, descriptions).
          Preserve all unique identities and consolidate other fields appropriately.
        Handle Missing Dates:
          Use logical assumptions to fill gaps where possible, prioritizing existing date information.
        Prioritize Current Roles:
          Ongoing roles (endDate = null) should be placed last in the timeline.
        Ensure Accuracy:
          Maintain all relevant data fields in the final timeline and ensure no essential information is lost.
      Output Format:
      Return a single array of IMemberEnrichmentDataNormalizedOrganization objects:

      Input Example:
      [
        [
          {
            "name": "Company X",
            "title": "Developer",
            "startDate": "2020-01-01",
            "endDate": "2021-01-01",
            "source": "Resume"
          },
          {
            "name": "Company X",
            "title": "Senior Developer",
            "startDate": "2020-06-01",
            "endDate": "2021-12-31",
            "source": "LinkedIn"
          }
        ],
        [
          {
            "name": "Company Y",
            "title": "Manager",
            "startDate": "2022-01-01",
            "endDate": null,
            "source": "Manual Entry"
          }
        ]
      ]

      Output Example:
      [
        {
          "name": "Company X",
          "title": "Developer",
          "startDate": "2020-01-01",
          "endDate": "2020-06-01",
          "source": "Resume"
        },
        {
          "name": "Company X",
          "title": "Senior Developer",
          "startDate": "2020-06-01",
          "endDate": "2021-12-31",
          "source": "LinkedIn"
        }
        {
          "name": "Company Y",
          "title": "Manager",
          "startDate": "2022-01-01",
          "endDate": null,
          "source": "Manual Entry"
        }
      ]

      Ensure the response is a **valid and complete JSON**.
      DO NOT output anything else.
      Output ONLY valid JSON
  `

  const llmService = new LlmService(
    svc.postgres.writer,
    {
      accessKeyId: process.env['CROWD_AWS_BEDROCK_ACCESS_KEY_ID'],
      secretAccessKey: process.env['CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY'],
    },
    svc.log,
  )

  const result = await llmService.squashWorkExperiencesFromMultipleSources<
    IMemberEnrichmentDataNormalizedOrganization[]
  >(memberId, prompt)
  return result.result
}
