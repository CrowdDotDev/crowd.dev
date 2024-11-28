import _ from 'lodash'

import { generateUUIDv1, replaceDoubleQuotes, setAttributesDefaultValues } from '@crowd/common'
import { LlmService } from '@crowd/common_services'
import {
  updateMemberAttributes,
  updateMemberContributions,
  updateMemberReach,
} from '@crowd/data-access-layer'
import { findMemberIdentityWithTheMostActivityInPlatform as findMemberIdentityWithTheMostActivityInPlatformQuestDb } from '@crowd/data-access-layer/src/activities'
import { upsertMemberIdentity } from '@crowd/data-access-layer/src/member_identities'
import { getPlatformPriorityArray } from '@crowd/data-access-layer/src/members/attributeSettings'
import {
  deleteMemberOrgById,
  fetchMemberDataForLLMSquashing as fetchMemberDataForLLMSquashingDb,
  findMemberEnrichmentCacheDb,
  findMemberEnrichmentCacheForAllSourcesDb,
  insertMemberEnrichmentCacheDb,
  insertWorkExperience,
  setMemberEnrichmentTryDate as setMemberEnrichmentTryDateDb,
  setMemberEnrichmentUpdateDate as setMemberEnrichmentUpdateDateDb,
  touchMemberEnrichmentCacheUpdatedAtDb,
  updateMemberEnrichmentCacheDb,
  updateMemberOrg,
} from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'
import { findOrCreateOrganization } from '@crowd/data-access-layer/src/organizations'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { refreshMaterializedView } from '@crowd/data-access-layer/src/utils'
import { RedisCache } from '@crowd/redis'
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

export async function getTenantPriorityArray(tenantId: string): Promise<string[]> {
  return getPlatformPriorityArray(dbStoreQx(svc.postgres.reader), tenantId)
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

export async function updateMemberUsingSquashedPayload(
  memberId: string,
  existingMemberData: IMemberOriginalData,
  squashedPayload: IMemberEnrichmentDataNormalized,
  hasContributions: boolean,
): Promise<boolean> {
  return await svc.postgres.writer.transactionally(async (tx) => {
    let updated = false
    const qx = dbStoreQx(tx)
    const promises = []

    // process identities
    if (squashedPayload.identities.length > 0) {
      svc.log.info({ memberId }, 'Adding to member identities!')
      for (const i of squashedPayload.identities) {
        updated = true
        promises.push(
          upsertMemberIdentity(qx, {
            memberId,
            tenantId: existingMemberData.tenantId,
            platform: i.platform,
            type: i.type,
            value: i.value,
            verified: i.verified,
          }),
        )
      }
    }

    // process contributions
    // if squashed payload has data from progai, we should fetch contributions here
    // it's ommited from the payload because it takes a lot of space
    svc.log.info('Processing contributions! ', { memberId, hasContributions })
    if (hasContributions) {
      promises.push(
        findMemberEnrichmentCache([MemberEnrichmentSource.PROGAI], memberId)
          .then((caches) => {
            if (caches.length > 0 && caches[0].data) {
              const progaiService = EnrichmentSourceServiceFactory.getEnrichmentSourceService(
                MemberEnrichmentSource.PROGAI,
                svc.log,
              )
              return progaiService.normalize(caches[0].data)
            }

            return undefined
          })
          .then((normalized) => {
            if (normalized) {
              const typed = normalized as IMemberEnrichmentDataNormalized
              svc.log.info('Normalized contributions: ', { contributions: typed.contributions })

              if (typed.contributions) {
                updated = true
                return updateMemberContributions(qx, memberId, typed.contributions)
              }
            }
          }),
      )
    }

    // process attributes
    let attributes = existingMemberData.attributes as Record<string, unknown>

    if (squashedPayload.attributes) {
      svc.log.info({ memberId }, 'Updating member attributes!')

      attributes = _.merge({}, attributes, squashedPayload.attributes)

      if (Object.keys(attributes).length > 0) {
        const priorities = await getTenantPriorityArray(existingMemberData.tenantId)
        attributes = await setAttributesDefaultValues(
          existingMemberData.tenantId,
          attributes,
          priorities,
        )
      }
      updated = true
      promises.push(updateMemberAttributes(qx, memberId, attributes))
    }

    // process reach
    if (squashedPayload.reach && Object.keys(squashedPayload.reach).length > 0) {
      svc.log.info({ memberId }, 'Updating member reach!')
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
        promises.push(updateMemberReach(qx, memberId, reach))
      }
    }

    if (squashedPayload.memberOrganizations.length > 0) {
      const orgPromises = []
      for (const org of squashedPayload.memberOrganizations) {
        orgPromises.push(
          findOrCreateOrganization(
            qx,
            existingMemberData.tenantId,
            OrganizationAttributeSource.ENRICHMENT,
            {
              displayName: org.name,
              description: org.organizationDescription,
              identities: org.identities ? org.identities : [],
            },
          ).then((orgId) => {
            // set the organization id for later use
            org.organizationId = orgId
            if (org.identities) {
              for (const i of org.identities) {
                i.organizationId = orgId
              }
            }
          }),
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
      )

      if (results.toDelete.length > 0) {
        for (const org of results.toDelete) {
          updated = true
          promises.push(deleteMemberOrgById(tx.transaction(), memberId, org.id))
        }
      }

      if (results.toCreate.length > 0) {
        for (const org of results.toCreate) {
          if (!org.organizationId) {
            throw new Error('Organization ID is missing!')
          }
          updated = true
          promises.push(
            insertWorkExperience(
              tx.transaction(),
              memberId,
              org.organizationId,
              org.title,
              org.startDate,
              org.endDate,
              org.source,
            ),
          )
        }
      }

      if (results.toUpdate.size > 0) {
        for (const [org, toUpdate] of results.toUpdate) {
          updated = true
          promises.push(updateMemberOrg(tx.transaction(), memberId, org, toUpdate))
        }
      }
    }

    if (updated) {
      await setMemberEnrichmentUpdateDateDb(tx.transaction(), memberId)
    } else {
      await setMemberEnrichmentTryDateDb(tx.transaction(), memberId)
    }

    await Promise.all(promises)
    svc.log.debug({ memberId }, 'Member sources processed successfully!')

    return updated
  })
}

export async function setMemberEnrichmentTryDate(memberId: string): Promise<void> {
  await setMemberEnrichmentTryDateDb(svc.postgres.writer.connection(), memberId)
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
    svc.postgres.writer,
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

  if (!categorized.selected && profilesFromUnverfiedIdentities.length > 0) {
    const result = await findRelatedLinkedinProfilesWithLLM(
      memberId,
      memberData,
      profilesFromUnverfiedIdentities,
    )

    // check if empty object
    if (result.profileIndex !== null) {
      categorized.selected = profilesFromUnverfiedIdentities[result.profileIndex]
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

interface IWorkExperienceChanges {
  toDelete: IMemberOrganizationData[]
  toCreate: IMemberEnrichmentDataNormalizedOrganization[]
  toUpdate: Map<IMemberOrganizationData, Record<string, any>>
}

function prepareWorkExperiences(
  oldVersion: IMemberOrganizationData[],
  newVersion: IMemberEnrichmentDataNormalizedOrganization[],
): IWorkExperienceChanges {
  // we delete all the work experiences that were not manually created
  const toDelete = oldVersion.filter((c) => c.source !== OrganizationSource.UI)

  const toCreate: IMemberEnrichmentDataNormalizedOrganization[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toUpdate: Map<IMemberOrganizationData, Record<string, any>> = new Map()

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
    let match = orderedNewVersion.find(
      (e) =>
        e.title === current.jobTitle &&
        e.identities &&
        e.identities.some((e) => e.organizationId === current.orgId),
    )
    if (!match) {
      // if we didn't find a match by title we should check dates
      match = orderedNewVersion.find(
        (e) =>
          dateIntersects(current.dateStart, current.dateEnd, e.startDate, e.endDate) &&
          e.identities &&
          e.identities.some((e) => e.organizationId === current.orgId),
      )
    }

    // if we found a match we can check if we need something to update
    if (match) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toUpdateInner: Record<string, any> = {}

      // lets check if the dates and title are the same otherwise we need to update them
      if (current.dateStart !== match.startDate) {
        toUpdateInner.dateStart = match.startDate
      }

      if (current.dateEnd !== match.endDate) {
        toUpdateInner.dateEnd = match.endDate
      }

      if (current.jobTitle !== match.title) {
        toUpdateInner.title = match.title
      }

      if (Object.keys(toUpdateInner).length > 0) {
        toUpdate.set(current, toUpdateInner)
      }

      // remove the match from the new version array so we later don't process it again
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

function dateIntersects(
  d1Start?: string | null,
  d1End?: string | null,
  d2Start?: string | null,
  d2End?: string | null,
): boolean {
  // If both periods have no dates at all, we can't determine intersection
  if ((!d1Start && !d1End) || (!d2Start && !d2End)) {
    return false
  }

  // Convert strings to timestamps, using fallbacks for missing dates
  const start1 = d1Start ? new Date(d1Start).getTime() : -Infinity
  const end1 = d1End ? new Date(d1End).getTime() : Infinity
  const start2 = d2Start ? new Date(d2Start).getTime() : -Infinity
  const end2 = d2End ? new Date(d2End).getTime() : Infinity

  // Periods intersect if one period's start is before other period's end
  // and that same period's end is after the other period's start
  return start1 <= end2 && end1 >= start2
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
