import axios from 'axios'

import { isEmail } from '@crowd/common'
import { Logger, LoggerBase } from '@crowd/logging'
import {
  IMemberEnrichmentCache,
  IMemberIdentity,
  MemberAttributeName,
  MemberEnrichmentSource,
  MemberIdentityType,
  OrganizationIdentityType,
  OrganizationSource,
  PlatformType,
} from '@crowd/types'

import { findMemberEnrichmentCacheForAllSources } from '../../activities/enrichment'
import { EnrichmentSourceServiceFactory } from '../../factory'
import {
  IEnrichmentService,
  IEnrichmentSourceInput,
  IMemberEnrichmentAttributeSettings,
  IMemberEnrichmentData,
  IMemberEnrichmentDataNormalized,
} from '../../types'
import { normalizeAttributes, normalizeSocialIdentity } from '../../utils/common'

import { IMemberEnrichmentCrustdataRemainingCredits, IMemberEnrichmentDataCrustdata } from './types'

export default class EnrichmentServiceCrustdata extends LoggerBase implements IEnrichmentService {
  public source: MemberEnrichmentSource = MemberEnrichmentSource.CRUSTDATA
  public platform = `enrichment-${this.source}`

  public alsoFindInputsInSourceCaches: MemberEnrichmentSource[] = [
    MemberEnrichmentSource.PROGAI,
    MemberEnrichmentSource.CLEARBIT,
    MemberEnrichmentSource.SERP,
  ]

  public enrichMembersWithActivityMoreThan = 1000

  public enrichableBySql = `("activitySummary".total_count > ${this.enrichMembersWithActivityMoreThan}) AND mi.verified AND mi.type = 'username' and mi.platform = 'linkedin'`

  public cacheObsoleteAfterSeconds = 60 * 60 * 24 * 90

  public attributeSettings: IMemberEnrichmentAttributeSettings = {
    [MemberAttributeName.AVATAR_URL]: {
      fields: ['profile_picture_url'],
    },
    [MemberAttributeName.JOB_TITLE]: {
      fields: ['title'],
    },
    [MemberAttributeName.BIO]: {
      fields: ['summary', 'headline'],
    },
    [MemberAttributeName.SKILLS]: {
      fields: ['skills'],
      transform: (skills: string) => skills.split(',').sort(),
    },
    [MemberAttributeName.LANGUAGES]: {
      fields: ['languages'],
      transform: (languages: string[]) => languages.sort(),
    },
    [MemberAttributeName.SCHOOLS]: {
      fields: ['all_schools'],
      transform: (schools: string[]) => schools.sort(),
    },
  }

  constructor(public readonly log: Logger) {
    super(log)
  }

  async isEnrichableBySource(input: IEnrichmentSourceInput): Promise<boolean> {
    const caches = await findMemberEnrichmentCacheForAllSources(input.memberId)

    let hasEnrichableLinkedinInCache = false
    for (const cache of caches) {
      if (this.alsoFindInputsInSourceCaches.includes(cache.source)) {
        const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(
          cache.source,
          this.log,
        )
        const normalized = service.normalize(cache.data) as IMemberEnrichmentDataNormalized
        if (normalized.identities.some((i) => i.platform === PlatformType.LINKEDIN)) {
          hasEnrichableLinkedinInCache = true
          break
        }
      }
    }

    return (
      input.activityCount > this.enrichMembersWithActivityMoreThan &&
      (hasEnrichableLinkedinInCache ||
        (input.linkedin && input.linkedin.value && input.linkedin.verified))
    )
  }

  async hasRemainingCredits(): Promise<boolean> {
    try {
      const config = {
        method: 'get',
        url: `${process.env['CROWD_ENRICHMENT_CRUSTDATA_URL']}/user/credits`,
        headers: {
          Authorization: `Token ${process.env['CROWD_ENRICHMENT_CRUSTDATA_API_KEY']}`,
        },
      }

      const response: IMemberEnrichmentCrustdataRemainingCredits = (await axios(config)).data

      return response.credits > 5
    } catch (error) {
      this.log.error('Error while checking Crustdata account usage', error)
      return false
    }
  }

  async getData(input: IEnrichmentSourceInput): Promise<IMemberEnrichmentDataCrustdata[] | null> {
    const profiles: IMemberEnrichmentDataCrustdata[] = []
    const caches = await findMemberEnrichmentCacheForAllSources(input.memberId)

    const consumableIdentities = await this.findDistinctScrapableLinkedinIdentities(input, caches)

    for (const identity of consumableIdentities) {
      const data = await this.getDataUsingLinkedinHandle(identity.value)
      if (data) {
        profiles.push({
          ...data,
          metadata: {
            repeatedTimesInDifferentSources: identity.repeatedTimesInDifferentSources,
            isFromVerifiedSource: identity.isFromVerifiedSource,
          },
        })
      }
    }

    return profiles.length > 0 ? profiles : null
  }

  private async getDataUsingLinkedinHandle(
    handle: string,
  ): Promise<IMemberEnrichmentDataCrustdata> {
    const url = `${process.env['CROWD_ENRICHMENT_CRUSTDATA_URL']}/screener/person/enrich`
    const config = {
      method: 'get',
      url,
      params: {
        linkedin_profile_url: `https://linkedin.com/in/${handle}`,
        enrich_realtime: false,
      },
      headers: {
        Authorization: `Token ${process.env['CROWD_ENRICHMENT_CRUSTDATA_API_KEY']}`,
      },
    }

    const response: IMemberEnrichmentDataCrustdata[] = (await axios(config)).data

    return response.length > 0 ? response[0] : null
  }

  private async findDistinctScrapableLinkedinIdentities(
    input: IEnrichmentSourceInput,
    caches: IMemberEnrichmentCache<IMemberEnrichmentData>[],
  ): Promise<
    (IMemberIdentity & { repeatedTimesInDifferentSources: number; isFromVerifiedSource: boolean })[]
  > {
    const consumableIdentities: (IMemberIdentity & {
      repeatedTimesInDifferentSources: number
      isFromVerifiedSource: boolean
    })[] = []
    const linkedinUrlHashmap = new Map<string, number>()

    for (const cache of caches) {
      if (this.alsoFindInputsInSourceCaches.includes(cache.source)) {
        const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(
          cache.source,
          this.log,
        )
        const normalized = service.normalize(cache.data) as IMemberEnrichmentDataNormalized
        if (normalized.identities.some((i) => i.platform === PlatformType.LINKEDIN)) {
          const identity = normalized.identities.find((i) => i.platform === PlatformType.LINKEDIN)
          if (!linkedinUrlHashmap.get(identity.value)) {
            consumableIdentities.push({
              ...identity,
              repeatedTimesInDifferentSources: 1,
              isFromVerifiedSource: false,
            })
            linkedinUrlHashmap.set(identity.value, 1)
          } else {
            const repeatedTimesInDifferentSources = linkedinUrlHashmap.get(identity.value) + 1
            linkedinUrlHashmap.set(identity.value, repeatedTimesInDifferentSources)
            consumableIdentities.find(
              (i) => i.value === identity.value,
            ).repeatedTimesInDifferentSources = repeatedTimesInDifferentSources
          }
        }
      }
    }

    if (input.linkedin && input.linkedin.value && input.linkedin.verified) {
      if (!linkedinUrlHashmap.get(input.linkedin.value)) {
        consumableIdentities.push({
          ...input.linkedin,
          repeatedTimesInDifferentSources: 1,
          isFromVerifiedSource: true,
        })
      } else {
        const repeatedTimesInDifferentSources = linkedinUrlHashmap.get(input.linkedin.value) + 1
        const identityFound = consumableIdentities.find((i) => i.value === input.linkedin.value)

        identityFound.repeatedTimesInDifferentSources = repeatedTimesInDifferentSources
        identityFound.isFromVerifiedSource = true
      }
    }
    return consumableIdentities
  }

  normalize(profiles: IMemberEnrichmentDataCrustdata[]): IMemberEnrichmentDataNormalized[] {
    const normalizedProfiles: IMemberEnrichmentDataNormalized[] = []

    for (const profile of profiles) {
      const profileNormalized = this.normalizeOneResult(profile)
      normalizedProfiles.push({ ...profileNormalized, metadata: profile.metadata })
    }

    return normalizedProfiles.length > 0 ? normalizedProfiles : null
  }

  private normalizeOneResult(
    data: IMemberEnrichmentDataCrustdata,
  ): IMemberEnrichmentDataNormalized {
    let normalized: IMemberEnrichmentDataNormalized = {
      identities: [],
      attributes: {},
      memberOrganizations: [],
      reach: {},
    }

    normalized = this.normalizeIdentities(data, normalized)
    normalized = normalizeAttributes(data, normalized, this.attributeSettings, this.platform)
    normalized = this.normalizeEmployment(data, normalized)

    if (data.num_of_connections) {
      normalized.reach[this.platform] = data.num_of_connections
    }

    return normalized
  }

  private normalizeIdentities(
    data: IMemberEnrichmentDataCrustdata,
    normalized: IMemberEnrichmentDataNormalized,
  ): IMemberEnrichmentDataNormalized {
    if (!normalized.identities) {
      normalized.identities = []
    }

    if (!normalized.attributes) {
      normalized.attributes = {}
    }

    if (data.name) {
      normalized.displayName = data.name
    }

    if (data.email) {
      for (const email of data.email.split(',').filter(isEmail)) {
        normalized.identities.push({
          type: MemberIdentityType.EMAIL,
          platform: this.platform,
          value: email.trim(),
          verified: false,
        })
      }
    }

    if (data.twitter_handle) {
      normalized = normalizeSocialIdentity(
        {
          handle: data.twitter_handle,
          platform: PlatformType.TWITTER,
        },
        MemberIdentityType.USERNAME,
        true,
        normalized,
      )
    }

    return normalized
  }

  private normalizeEmployment(
    data: IMemberEnrichmentDataCrustdata,
    normalized: IMemberEnrichmentDataNormalized,
  ): IMemberEnrichmentDataNormalized {
    if (!normalized.memberOrganizations) {
      normalized.memberOrganizations = []
    }

    const employmentInformation = (data.past_employers || []).concat(data.current_employers || [])
    if (employmentInformation.length > 0) {
      for (const workExperience of employmentInformation) {
        const identities = []

        if (workExperience.employer_linkedin_id) {
          identities.push({
            platform: PlatformType.LINKEDIN,
            value: `company:${workExperience.employer_linkedin_id}`,
            type: OrganizationIdentityType.USERNAME,
            verified: true,
          })
        }

        normalized.memberOrganizations.push({
          name: workExperience.employer_name,
          source: OrganizationSource.ENRICHMENT_CRUSTDATA,
          identities,
          title: workExperience.employee_title,
          startDate: workExperience.start_date,
          endDate: workExperience.end_date,
          organizationDescription: workExperience.employer_linkedin_description,
        })
      }
    }

    return normalized
  }
}
