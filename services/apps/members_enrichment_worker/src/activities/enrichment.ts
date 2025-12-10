import _ from 'lodash'

import {
  generateUUIDv1,
  hasIntersection,
  replaceDoubleQuotes,
  setAttributesDefaultValues,
} from '@crowd/common'
import { LlmService } from '@crowd/common_services'
import {
  updateMemberAttributes,
  updateMemberContributions,
  updateMemberReach,
} from '@crowd/data-access-layer'
import { findMemberIdentityWithTheMostActivityInPlatform as getMemberMostActiveIdentity } from '@crowd/data-access-layer/src/activityRelations'
import { upsertMemberIdentity } from '@crowd/data-access-layer/src/member_identities'
import { getPlatformPriorityArray } from '@crowd/data-access-layer/src/members/attributeSettings'
import {
  deleteMemberOrgById,
  fetchMemberDataForLLMSquashing as fetchMemberDataForLLMSquashingDb,
  findMemberEnrichmentCacheDb,
  findMemberEnrichmentCacheForAllSourcesDb,
  insertMemberEnrichmentCacheDb,
  insertWorkExperience,
  setMemberEnrichmentLastTriedAt,
  setMemberEnrichmentUpdatedAt,
  touchMemberEnrichmentCacheUpdatedAtDb,
  updateMemberEnrichmentCacheDb,
  updateMemberOrg,
} from '@crowd/data-access-layer/src/old/apps/members_enrichment_worker'
import { findOrCreateOrganization } from '@crowd/data-access-layer/src/organizations'
import { dbStoreQx, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { refreshMaterializedView } from '@crowd/data-access-layer/src/utils'
import { SearchSyncApiClient } from '@crowd/opensearch'
import { RateLimitBackoff, RedisCache } from '@crowd/redis'
import {
  IEnrichableMember,
  IEnrichableMemberIdentityActivityAggregate,
  IMemberEnrichmentCache,
  IMemberOrganizationData,
  IMemberOriginalData,
  IMemberReach,
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

/* eslint-disable @typescript-eslint/no-explicit-any */

async function setRateLimitBackoff(
  source: MemberEnrichmentSource,
  backoffSeconds: number,
): Promise<void> {
  const redisCache = new RedisCache(`member-enrichment-${source}`, svc.redis, svc.log)
  const backoff = new RateLimitBackoff(redisCache, 'rate-limit-backoff')
  await backoff.set(backoffSeconds)
}

export async function getEnrichmentData(
  source: MemberEnrichmentSource,
  input: IEnrichmentSourceInput,
): Promise<IMemberEnrichmentData | null> {
  const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(source, svc.log)

  if (await service.isEnrichableBySource(input)) {
    try {
      return await service.getData(input)
    } catch (err) {
      if (err.name === 'EnrichmentRateLimitError') {
        await setRateLimitBackoff(source, err.rateLimitResetSeconds)
        svc.log.warn(`${source} rate limit exceeded. Skipping enrichment source.`)
        return null
      }

      svc.log.error({ source, err }, 'Error getting enrichment data!')
      throw err
    }
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
    github: input.identities.find(
      (i) =>
        i.verified && i.platform === PlatformType.GITHUB && i.type === MemberIdentityType.USERNAME,
    ),
    displayName: input.displayName || undefined,
    website: input.website || undefined,
    location: input.location || undefined,
    activityCount: input.activityCount || 0,
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
  const redisCache = new RedisCache(`member-enrichment-${source}`, svc.redis, svc.log)
  if (hasCredits) {
    await redisCache.set('hasRemainingCredits', 'true', 60)
  } else {
    await redisCache.set('hasRemainingCredits', 'false', 60)
  }
}

export async function getHasRemainingCredits(source: MemberEnrichmentSource): Promise<boolean> {
  const redisCache = new RedisCache(`member-enrichment-${source}`, svc.redis, svc.log)
  return (await redisCache.get('hasRemainingCredits')) === 'true'
}

export async function hasRemainingCreditsExists(source: MemberEnrichmentSource): Promise<boolean> {
  const redisCache = new RedisCache(`member-enrichment-${source}`, svc.redis, svc.log)
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

export async function getPriorityArray(): Promise<string[]> {
  return getPlatformPriorityArray(dbStoreQx(svc.postgres.reader))
}

export async function fetchMemberDataForLLMSquashing(
  memberId: string,
): Promise<IMemberOriginalData> {
  return fetchMemberDataForLLMSquashingDb(svc.postgres.reader.connection(), memberId)
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

export async function touchMemberEnrichmentLastTriedAt(memberId: string): Promise<void> {
  await setMemberEnrichmentLastTriedAt(svc.postgres.writer.connection(), memberId)
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
  return getMemberMostActiveIdentity(pgpQx(svc.postgres.reader.connection()), memberId, platform)
}

export async function updateMemberUsingSquashedPayload(
  memberId: string,
  existingMemberData: IMemberOriginalData,
  squashedPayload: IMemberEnrichmentDataNormalized,
  hasContributions: boolean,
  isHighConfidenceSourceSelectedForWorkExperiences: boolean,
): Promise<boolean> {
  return await svc.postgres.writer.transactionally(async (tx) => {
    let updated = false
    const qx = dbStoreQx(tx)

    // process identities
    if (squashedPayload.identities.length > 0) {
      svc.log.debug({ memberId }, 'Adding to member identities!')
      for (const i of squashedPayload.identities) {
        updated = true
        await upsertMemberIdentity(qx, {
          memberId,
          platform: i.platform,
          type: i.type,
          value: i.value,
          verified: i.verified,
        })
      }
    }

    // process contributions
    // if squashed payload has data from progai, we should fetch contributions here
    // it's ommited from the payload because it takes a lot of space
    svc.log.debug('Processing contributions! ', { memberId, hasContributions })
    if (hasContributions) {
      const caches = await findMemberEnrichmentCache([MemberEnrichmentSource.PROGAI], memberId)
      if (caches?.length > 0 && caches[0]?.data) {
        const progaiService = EnrichmentSourceServiceFactory.getEnrichmentSourceService(
          MemberEnrichmentSource.PROGAI,
          svc.log,
        )
        const normalized = progaiService.normalize(caches[0].data)
        if (normalized) {
          const typed = normalized as IMemberEnrichmentDataNormalized

          if (typed.contributions) {
            updated = true
            await updateMemberContributions(qx, memberId, typed.contributions)
          }
        }
      }
    }

    // process attributes
    let attributes = existingMemberData.attributes as Record<string, unknown>

    if (squashedPayload.attributes) {
      svc.log.debug({ memberId }, 'Updating member attributes!')

      attributes = _.merge({}, attributes, squashedPayload.attributes)

      if (Object.keys(attributes).length > 0) {
        const priorities = await getPriorityArray()
        attributes = await setAttributesDefaultValues(attributes, priorities)
      }
      updated = true
      await updateMemberAttributes(qx, memberId, attributes)
    }

    // process reach
    if (squashedPayload.reach && Object.keys(squashedPayload.reach).length > 0) {
      svc.log.debug({ memberId }, 'Updating member reach!')
      let reach: IMemberReach

      if (existingMemberData.reach && existingMemberData.reach.total) {
        let total = existingMemberData.reach.total === -1 ? 0 : existingMemberData.reach.total
        for (const reachSource of Object.keys(squashedPayload.reach)) {
          total += squashedPayload.reach[reachSource]
        }
        reach = {
          ...existingMemberData.reach,
          ...squashedPayload.reach,
          total,
        }

        updated = true
        await updateMemberReach(qx, memberId, reach)
      }
    }

    const orgIdsToSync: string[] = []

    if (squashedPayload.memberOrganizations.length > 0) {
      const orgPromises = []

      // try matching member's existing organizations with the new ones
      // we'll be using displayName, title, dates
      for (const org of squashedPayload.memberOrganizations) {
        if (!org.organizationId) {
          // Check if any similar in existing work experiences
          const existingOrg = existingMemberData.organizations.find((o) =>
            doesIncomingOrgExistInExistingOrgs(o, org),
          )

          if (existingOrg) {
            // Get all orgs with the same name as the current one
            const matchingOrgs = squashedPayload.memberOrganizations.filter(
              (otherOrg) => otherOrg.name === org.name,
            )

            // Set organizationId for all matching orgs
            for (const matchingOrg of matchingOrgs) {
              matchingOrg.organizationId = existingOrg.orgId
            }
          }
        }
      }

      for (const org of squashedPayload.memberOrganizations.filter((o) => !o.organizationId)) {
        // Skip organizations that don't have a name or any verified identities
        const identities = org.identities ? org.identities : []
        const verifiedIdentities = identities.filter((i) => i.verified)

        if (!org.name && verifiedIdentities.length === 0) {
          svc.log.debug(
            { orgId: org.organizationId },
            'Skipping organization without name or verified identities',
          )
          continue
        }

        orgPromises.push(
          findOrCreateOrganization(qx, OrganizationAttributeSource.ENRICHMENT, {
            displayName: org.name,
            description: org.organizationDescription,
            identities,
          })
            .then((orgId) => {
              // set the organization id for later use
              org.organizationId = orgId
              if (org.identities) {
                for (const i of org.identities) {
                  i.organizationId = orgId
                }
              }
              if (orgId) {
                orgIdsToSync.push(orgId)
              }
            })
            .then(() =>
              Promise.all(
                orgIdsToSync.map((orgId) =>
                  syncOrganization(orgId).catch((error) => {
                    console.error(`Failed to sync organization with ID ${orgId}:`, error)
                  }),
                ),
              ),
            ),
        )
      }

      await Promise.all(orgPromises)
      // ignore all organizations that were not created
      squashedPayload.memberOrganizations = squashedPayload.memberOrganizations.filter(
        (o) => o.organizationId,
      )

      const results = prepareWorkExperiences(
        existingMemberData.organizations,
        squashedPayload.memberOrganizations,
        isHighConfidenceSourceSelectedForWorkExperiences,
      )

      if (results.toDelete.length > 0) {
        for (const org of results.toDelete) {
          updated = true
          await deleteMemberOrgById(tx.transaction(), org.id)
        }
      }

      if (results.toCreate.length > 0) {
        for (const org of results.toCreate) {
          if (!org.organizationId) {
            throw new Error('Organization ID is missing!')
          }
          updated = true
          await insertWorkExperience(
            tx.transaction(),
            memberId,
            org.organizationId,
            org.title,
            org.startDate,
            org.endDate,
            org.source,
          )
        }
      }

      if (results.toUpdate.size > 0) {
        for (const [org, toUpdate] of results.toUpdate) {
          updated = true
          await updateMemberOrg(tx.transaction(), memberId, org, toUpdate)
        }
      }
    }

    if (updated) {
      await setMemberEnrichmentUpdatedAt(tx.transaction(), memberId)
      await syncMember(memberId)
    } else {
      await setMemberEnrichmentLastTriedAt(tx.transaction(), memberId)
    }

    svc.log.debug({ memberId }, 'Member sources processed successfully!')

    return updated
  })
}

export function doesIncomingOrgExistInExistingOrgs(
  existingOrg: IMemberOrganizationData,
  incomingOrg: IMemberEnrichmentDataNormalizedOrganization,
): boolean {
  // Check if any similar in existing work experiences
  const incomingVerifiedPrimaryDomainIdentityValues = incomingOrg.identities
    .filter((i) => i.type === OrganizationIdentityType.PRIMARY_DOMAIN && i.verified)
    .map((i) => i.value)

  const existingVerifiedPrimaryDomainIdentityValues = existingOrg.identities
    .filter((i) => i.type === OrganizationIdentityType.PRIMARY_DOMAIN && i.verified)
    .map((i) => i.value)

  const incomingOrgStartDate = incomingOrg.startDate ? new Date(incomingOrg.startDate) : null
  const incomingOrgEndDate = incomingOrg.endDate ? new Date(incomingOrg.endDate) : null
  const existingOrgStartDate = existingOrg.dateStart ? new Date(existingOrg.dateStart) : null
  const existingOrgEndEndDate = existingOrg.dateEnd ? new Date(existingOrg.dateEnd) : null

  const isSameStartMonthYear =
    (!incomingOrgStartDate && !existingOrgStartDate) || // Both start dates are null
    (incomingOrgStartDate &&
      existingOrgStartDate &&
      incomingOrgStartDate.getMonth() === existingOrgStartDate.getMonth() &&
      incomingOrgStartDate.getFullYear() === existingOrgStartDate.getFullYear())

  const isSameEndMonthYear =
    (!incomingOrgEndDate && !existingOrgEndEndDate) || // Both end dates are null
    (incomingOrgEndDate &&
      existingOrgEndEndDate &&
      incomingOrgEndDate.getMonth() === existingOrgEndEndDate.getMonth() &&
      incomingOrgEndDate.getFullYear() === existingOrgEndEndDate.getFullYear())

  return (
    hasIntersection(
      incomingVerifiedPrimaryDomainIdentityValues,
      existingVerifiedPrimaryDomainIdentityValues,
    ) ||
    ((existingOrg.orgName.toLowerCase().includes(incomingOrg.name.toLowerCase()) ||
      incomingOrg.name.toLowerCase().includes(existingOrg.orgName.toLowerCase())) &&
      ((isSameStartMonthYear && isSameEndMonthYear) || incomingOrg.title === existingOrg.jobTitle))
  )
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
): Promise<{ profileIndex: number }> {
  // Some organizations have too many identities, which exceeds the llm input token limit,
  // so we deduplicate the identities, prioritize verified ones, and select the top 50 per organization.
  memberProfile.organizations = memberProfile.organizations?.map((org) => ({
    ...org,
    identities: _.uniqBy(org.identities, (i) => `${i.platform}:${i.value}`)
      .sort((a, b) => (a.verified === b.verified ? 0 : a.verified ? -1 : 1))
      .slice(0, 50),
  }))

  const prompt = `
"You are an expert at analyzing and matching personal profiles. I will provide you with the details of a member profile and an array of LinkedIn profiles in JSON format. Your task is to analyze the data and return only the index of the profile that most likely belongs to the member.

Instructions:
    Match the profiles based on flexible criteria, allowing partial matches or similarities.
    Output valid JSON only. The JSON should include the matched profile.
    The JSON should include the matched profile's index from the input array, 0-indexed. If no match is found, return "profileIndex": null.
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
    "profileIndex": 0, /* 0-indexed index of the matched profile */ 
  }

  If no match is found: 
  { 
    "profileIndex": null
  }

  Return exactly one profile in valid JSON format.
    If no match is found, return null in profileIndex.
    Ensure the response is a **valid and complete JSON**.
    DO NOT output anything else.
    Output ONLY valid JSON
  `

  const llmService = new LlmService(
    dbStoreQx(svc.postgres.writer),
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
    [key: string]: unknown[]
  },
): Promise<{ [key: string]: unknown }> {
  const prompt = `
      I have an object with attributes structured as follows:
      
      ${JSON.stringify(attributes)}

      The possible attributes include:

      # avatarUrl (string): Represents URLs for user profile pictures.
      # jobTitle (string): Represents job titles or roles.
      # bio (string): Represents user biographies or descriptions.
      # location (string): Represents user locations.
      
      Each attribute has an array of possible values, and the task is to determine the best value for each attribute based on the following criteria:
      General rules:
        Select the most relevant and accurate value for each attribute.
        Repeated information across values can be considered a strong indicator.

      Specific rules:
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
    dbStoreQx(svc.postgres.writer),
    {
      accessKeyId: process.env['CROWD_AWS_BEDROCK_ACCESS_KEY_ID'],
      secretAccessKey: process.env['CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY'],
    },
    svc.log,
  )

  const result = await llmService.squashMultipleValueAttributes<{ [key: string]: unknown }>(
    memberId,
    prompt,
  )
  return result.result
}

export async function findWhichLinkedinProfileToUseAmongScraperResult(
  memberId: string,
  memberData: IMemberOriginalData,
  profiles: IMemberEnrichmentDataNormalized[],
): Promise<{
  selected: IMemberEnrichmentDataNormalized
  discarded: IMemberEnrichmentDataNormalized[]
}> {
  const categorized = {
    selected: null,
    discarded: [],
  }
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
      if (result.profileIndex !== null) {
        categorized.selected = profilesFromVerifiedIdentities[result.profileIndex]
        // add profiles not selected to discarded
        for (let i = 0; i < profilesFromVerifiedIdentities.length; i++) {
          if (i !== result.profileIndex) {
            categorized.discarded.push(profilesFromVerifiedIdentities[i])
          }
        }
      } else {
        // if no match found, we should discard all profiles from verified identities
        categorized.discarded = profilesFromVerifiedIdentities
      }
    } else {
      categorized.selected = profilesFromVerifiedIdentities[0]
    }
  }

  if (profilesFromUnverfiedIdentities.length > 0) {
    if (categorized.selected) {
      // we already found a match from verified identities, discard all profiles from unverified identities
      categorized.discarded = profilesFromUnverfiedIdentities
    } else {
      const result = await findRelatedLinkedinProfilesWithLLM(
        memberId,
        memberData,
        profilesFromUnverfiedIdentities,
      )

      // check if empty object
      if (result.profileIndex !== null) {
        if (!categorized.selected) {
          categorized.selected = profilesFromUnverfiedIdentities[result.profileIndex]
        }
        // add profiles not selected to discarded
        for (let i = 0; i < profilesFromUnverfiedIdentities.length; i++) {
          if (i !== result.profileIndex) {
            categorized.discarded.push(profilesFromUnverfiedIdentities[i])
          }
        }
      } else {
        // if no match found, we should discard all profiles from verified identities
        categorized.discarded = profilesFromUnverfiedIdentities
      }
    }
  }

  return categorized
}

export async function squashWorkExperiencesWithLLM(
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
        Merge Overlapping Roles IN DIFFERENT SOURCES:
          Never try merging roles from the same source.
          If multiple roles from the same organization overlap in time IN DIFFERENT SOURCES, squash them into one entry with a unified startDate, endDate, and picked information (e.g., job titles, descriptions).
          Preserve all unique identities and consolidate other fields appropriately.
          If necessary, ONLY merge dateRanges and NEVER merge titles together, but pick the one that best represents the role.
        Handle Missing Dates:
          Use logical assumptions to fill gaps where possible, always using existing date information but nothing else.
          If there is a role with a missing startDate and a missing endDate, and there's also another role from same or similar organization with dates, you can remove the role with missing dates.
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
    dbStoreQx(svc.postgres.writer),
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

interface IWorkExperienceChanges {
  toDelete: IMemberOrganizationData[]
  toCreate: IMemberEnrichmentDataNormalizedOrganization[]
  toUpdate: Map<IMemberOrganizationData, Record<string, any>>
}

function prepareWorkExperiences(
  oldVersion: IMemberOrganizationData[],
  newVersion: IMemberEnrichmentDataNormalizedOrganization[],
  isHighConfidenceSourceSelectedForWorkExperiences: boolean,
): IWorkExperienceChanges {
  // we delete all the work experiences that were not manually created
  let toDelete = oldVersion.filter((c) => c.source !== OrganizationSource.UI)

  const toCreate: IMemberEnrichmentDataNormalizedOrganization[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toUpdate: Map<IMemberOrganizationData, Record<string, any>> = new Map()

  if (isHighConfidenceSourceSelectedForWorkExperiences) {
    toDelete = oldVersion
    toCreate.push(...newVersion)
    return {
      toDelete,
      toCreate,
      toUpdate,
    }
  }

  // sort both versions by start date and only use manual changes from the current version
  const orderedCurrentVersion = oldVersion
    .filter((c) => c.source === OrganizationSource.UI)
    .sort((a, b) => {
      // If either value is null/undefined, move it to the beginning
      if (!a.dateStart && !b.dateStart) return 0
      if (!a.dateStart) return -1
      if (!b.dateStart) return 1

      // Compare dates if both values exist
      return new Date(a.dateStart as string).getTime() - new Date(b.dateStart as string).getTime()
    })

  let orderedNewVersion = newVersion.sort((a, b) => {
    // If either value is null/undefined, move it to the beginning
    if (!a.startDate && !b.startDate) return 0
    if (!a.startDate) return -1
    if (!b.startDate) return 1

    // Compare dates if both values exist
    return new Date(a.startDate as string).getTime() - new Date(b.startDate as string).getTime()
  })

  // set ids and new flag to new versions just so we can easily manipulate the array later
  for (const exp of orderedNewVersion) {
    exp.id = generateUUIDv1()
  }

  // we iterate through the existing version experiences to see if update is needed
  for (const current of orderedCurrentVersion) {
    // try and find a matching experience in the new versions by title
    const match = orderedNewVersion.find(
      (e) =>
        e.title === current.jobTitle &&
        e.identities &&
        e.identities.some((e) => e.organizationId === current.orgId),
    )

    // if we found a match we can check if we need something to update
    if (
      match &&
      current.dateStart === match.startDate &&
      current.dateEnd === null &&
      match.endDate !== null
    ) {
      const toUpdateInner: Record<string, any> = {}

      toUpdateInner.dateEnd = match.endDate
      toUpdate.set(current, toUpdateInner)

      // remove the match from the new version array so we later don't process it again
      orderedNewVersion = orderedNewVersion.filter((e) => e.id !== match.id)
    } else if (
      match &&
      (current.dateStart !== match.startDate || current.dateEnd !== null || match.endDate === null)
    ) {
      // there's an incoming work experiences, but it's conflicting with the existing manually updated data
      // we shouldn't add or update anything when this happens
      // we can only update dateEnd of existing manually changed data, when it has a null dateEnd
      orderedNewVersion = orderedNewVersion.filter((e) => e.id !== match.id)
    }
    // if we didn't find a match we should just leave it as it is in the database since it was manual input
  }

  // the remaining experiences in the new version array are just new experiences to create
  toCreate.push(...orderedNewVersion)

  return {
    toDelete,
    toCreate,
    toUpdate,
  }
}

export async function syncMember(memberId: string): Promise<void> {
  const syncApi = new SearchSyncApiClient({
    baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
  })

  await syncApi.triggerMemberSync(memberId, { withAggs: false })
}

export async function syncOrganization(organizationId: string): Promise<void> {
  const syncApi = new SearchSyncApiClient({
    baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
  })

  await syncApi.triggerOrganizationSync(organizationId, undefined, { withAggs: false })
}

export async function cleanAttributeValue(
  attributeValue: string | string[] | Record<string, any>,
): Promise<string | string[] | Record<string, any>> {
  if (!attributeValue) {
    return attributeValue
  }

  if (typeof attributeValue === 'string') {
    return replaceDoubleQuotes(attributeValue)
  }

  if (Array.isArray(attributeValue)) {
    return attributeValue.map((v) => (typeof v === 'string' ? replaceDoubleQuotes(v) : v))
  }

  if (typeof attributeValue === 'object' && attributeValue !== null) {
    const cleanedObject: Record<string, any> = {}
    for (const [key, value] of Object.entries(attributeValue)) {
      if (typeof value === 'string') {
        cleanedObject[key] = replaceDoubleQuotes(value)
      } else {
        cleanedObject[key] = value
      }
    }
    return cleanedObject
  }

  return attributeValue
}
