import axios from 'axios'
import lodash from 'lodash'

import { Logger, LoggerBase } from '@crowd/logging'
import {
  MemberAttributeName,
  MemberEnrichmentSource,
  MemberIdentityType,
  OrganizationIdentityType,
  OrganizationSource,
  PlatformType,
} from '@crowd/types'

import {
  IEnrichmentService,
  IEnrichmentSourceInput,
  IMemberEnrichmentAttributeSettings,
  IMemberEnrichmentDataNormalized,
} from '../../types'
import { normalizeAttributes, normalizeSocialIdentity } from '../../utils/common'

import {
  IEnrichmentAPICertificationProgAI,
  IEnrichmentAPIContributionProgAI,
  IEnrichmentAPIEducationProgAI,
  IEnrichmentAPISkillsProgAI,
  IEnrichmentAPIWorkExperienceProgAI,
  IMemberEnrichmentDataProgAI,
  IMemberEnrichmentDataProgAIResponse,
} from './types'

export default class EnrichmentServiceProgAI extends LoggerBase implements IEnrichmentService {
  public source: MemberEnrichmentSource = MemberEnrichmentSource.PROGAI
  public platform = `enrichment-${this.source}`

  public enrichableBySql = `mi.verified and ((mi.type = 'username' AND mi.platform = 'github') OR (mi.type = 'email'))`

  // bust cache after 90 days
  public cacheObsoleteAfterSeconds = 60 * 60 * 24 * 90

  public maxConcurrentRequests = 1000

  public attributeSettings: IMemberEnrichmentAttributeSettings = {
    [MemberAttributeName.AVATAR_URL]: {
      fields: ['profile_pic_url'],
    },
    [MemberAttributeName.LOCATION]: {
      fields: ['location'],
    },
    [MemberAttributeName.BIO]: {
      fields: ['title', 'work_experiences[0].title'],
    },
    [MemberAttributeName.SENIORITY_LEVEL]: {
      fields: ['seniority_level'],
    },
    [MemberAttributeName.COUNTRY]: {
      fields: ['country'],
    },
    [MemberAttributeName.PROGRAMMING_LANGUAGES]: {
      fields: ['programming_languages'],
    },
    [MemberAttributeName.LANGUAGES]: {
      fields: ['languages'],
    },
    [MemberAttributeName.YEARS_OF_EXPERIENCE]: {
      fields: ['years_of_experience'],
    },
    [MemberAttributeName.EXPERTISE]: {
      fields: ['expertise'],
    },
    [MemberAttributeName.WORK_EXPERIENCES]: {
      fields: ['work_experiences'],
      transform: (workExperiences: IEnrichmentAPIWorkExperienceProgAI[]) =>
        workExperiences.map((workExperience) => {
          const { title, company, location, startDate, endDate } = workExperience
          return {
            title,
            company,
            location,
            startDate,
            endDate: endDate || 'Present',
          }
        }),
    },
    [MemberAttributeName.EDUCATION]: {
      fields: ['educations'],
      transform: (educations: IEnrichmentAPIEducationProgAI[]) =>
        educations.map((education) => {
          const { campus, major, specialization, startDate, endDate } = education
          return {
            campus,
            major,
            specialization,
            startDate,
            endDate: endDate || 'Present',
          }
        }),
    },
    [MemberAttributeName.AWARDS]: {
      fields: ['awards'],
    },
    [MemberAttributeName.CERTIFICATIONS]: {
      fields: ['certifications'],
      transform: (certifications: IEnrichmentAPICertificationProgAI[]) =>
        certifications.map((certification) => {
          const { title, description } = certification
          return {
            title,
            description,
          }
        }),
    },
  }

  constructor(
    public readonly log: Logger,
    private readonly alsoUseEmailIdentitiesForEnrichment: boolean,
    private readonly enrichEmailIdentities: boolean,
  ) {
    super(log)
  }

  async isEnrichableBySource(input: IEnrichmentSourceInput): Promise<boolean> {
    const enrichableUsingGithubHandle = !!input.github?.value
    const enrichableUsingEmail = this.alsoUseEmailIdentitiesForEnrichment && !!input.email?.value
    return enrichableUsingGithubHandle || enrichableUsingEmail
  }

  async hasRemainingCredits(): Promise<boolean> {
    return true
  }

  async getData(input: IEnrichmentSourceInput): Promise<IMemberEnrichmentDataProgAI> {
    let enriched: IMemberEnrichmentDataProgAI = null

    // get data logic
    if (input.github) {
      enriched = await this.getDataUsingGitHubHandle(input.github.value)
    }

    if (this.alsoUseEmailIdentitiesForEnrichment) {
      if (!enriched && input.email) {
        enriched = await this.getDataUsingEmailAddress(input.email.value)
      }
    }

    return enriched
  }

  normalize(data: IMemberEnrichmentDataProgAI): IMemberEnrichmentDataNormalized {
    let normalized: IMemberEnrichmentDataNormalized = {
      identities: [],
      attributes: {},
      contributions: [],
      memberOrganizations: [],
    }
    normalized = this.fillPlatformData(data, normalized)
    normalized = normalizeAttributes(data, normalized, this.attributeSettings, this.platform)
    normalized = this.fillSkills(data, normalized)
    normalized = this.normalizeEmployment(data, normalized)

    return normalized
  }

  private fillSkills(
    data: IMemberEnrichmentDataProgAI,
    normalized: IMemberEnrichmentDataNormalized,
  ): IMemberEnrichmentDataNormalized {
    if (!normalized.attributes) {
      normalized.attributes = {}
    }

    if (data.skills) {
      if (!normalized.attributes.skills) {
        normalized.attributes.skills = {}
      }

      // Assign unique and ordered skills to 'member.attributes[MemberAttributeName.SKILLS].enrichment'
      normalized.attributes[MemberAttributeName.SKILLS].enrichment = lodash.uniq([
        // Use 'lodash.orderBy' to sort the skills by weight in descending order
        ...lodash
          .orderBy(data.skills || [], ['weight'], ['desc'])
          .map((s: IEnrichmentAPISkillsProgAI) => s.skill),
      ])
    }

    return normalized
  }

  private fillPlatformData(
    data: IMemberEnrichmentDataProgAI,
    normalized: IMemberEnrichmentDataNormalized,
  ): IMemberEnrichmentDataNormalized {
    if (!normalized.identities) {
      normalized.identities = []
    }

    if (!normalized.attributes) {
      normalized.attributes = {}
    }

    if (this.enrichEmailIdentities) {
      if (data.emails && Array.isArray(data.emails)) {
        if (data.emails.length > 0) {
          const emailSet = new Set<string>(
            data.emails.filter((email) => !email.includes('noreply.github')),
          )

          for (const email of emailSet) {
            normalized.identities.push({
              value: email,
              type: MemberIdentityType.EMAIL,
              platform: this.platform,
              verified: false,
            })
          }
        }
      }
    }

    normalized.contributions = data.oss_contributions?.map(
      (contribution: IEnrichmentAPIContributionProgAI) => ({
        id: contribution.id,
        topics: contribution.topics,
        summary: contribution.summary,
        url: contribution.github_url,
        firstCommitDate: contribution.first_commit_date,
        lastCommitDate: contribution.last_commit_date,
        numberCommits: contribution.num_of_commits,
      }),
    )

    if (data.github_handle) {
      normalized = normalizeSocialIdentity(
        {
          handle: data.github_handle,
          platform: PlatformType.GITHUB,
        },
        MemberIdentityType.USERNAME,
        true,
        normalized,
      )
    }

    if (data.linkedin_url) {
      const linkedinHandle = data.linkedin_url.split('/').pop()
      normalized = normalizeSocialIdentity(
        {
          handle: linkedinHandle,
          platform: PlatformType.LINKEDIN,
        },
        MemberIdentityType.USERNAME,
        true,
        normalized,
      )
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
    data: IMemberEnrichmentDataProgAI,
    normalized: IMemberEnrichmentDataNormalized,
  ): IMemberEnrichmentDataNormalized {
    if (data.work_experiences) {
      for (const workExperience of data.work_experiences) {
        const identities = []

        if (workExperience.companyUrl) {
          identities.push({
            platform: PlatformType.LINKEDIN,
            value: workExperience.companyUrl,
            type: OrganizationIdentityType.PRIMARY_DOMAIN,
            verified: true,
          })
        }

        if (workExperience.companyLinkedInUrl) {
          identities.push({
            platform: PlatformType.LINKEDIN,
            value: `company:${workExperience.companyLinkedInUrl.split('/').pop()}`,
            type: OrganizationIdentityType.USERNAME,
            verified: true,
          })
        }

        normalized.memberOrganizations.push({
          name: workExperience.company,
          source: OrganizationSource.ENRICHMENT_PROGAI,
          identities,
          title: workExperience.title,
          startDate: workExperience.startDate,
          endDate: workExperience.endDate,
        })
      }
    }

    return normalized
  }

  async getDataUsingGitHubHandle(githubUsername: string): Promise<IMemberEnrichmentDataProgAI> {
    const url = `${process.env['CROWD_ENRICHMENT_PROGAI_URL']}/get_profile`
    const config = {
      method: 'get',
      url,
      params: {
        github_handle: githubUsername,
        with_emails: true,
        api_key: process.env['CROWD_ENRICHMENT_PROGAI_API_KEY'],
      },
      headers: {},
    }

    const response: IMemberEnrichmentDataProgAIResponse = (await axios(config)).data
    return response?.profile || null
  }

  async getDataUsingEmailAddress(email: string): Promise<IMemberEnrichmentDataProgAI> {
    const url = `${process.env['CROWD_ENRICHMENT_PROGAI_URL']}/get_profile`
    const config = {
      method: 'get',
      url,
      params: {
        email,
        with_emails: true,
        api_key: process.env['CROWD_ENRICHMENT_PROGAI_API_KEY'],
      },
      headers: {},
    }

    const response = (await axios(config)).data
    return response?.profile || null
  }
}
