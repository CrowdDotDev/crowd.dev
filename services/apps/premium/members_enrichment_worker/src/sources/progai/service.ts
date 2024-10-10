import axios from 'axios'
import lodash from 'lodash'
import { IEnrichmentDataNormalized, IEnrichmentService, IEnrichmentSourceInput } from '../../types'
import {
  IEnrichmentAPICertificationProgAI,
  IEnrichmentAPIContributionProgAI,
  IEnrichmentAPIEducationProgAI,
  IEnrichmentAPISkillsProgAI,
  IEnrichmentAPIWorkExperienceProgAI,
  IEnrichmentDataProgAI,
  IEnrichmentDataProgAIResponse,
} from './types'
import {
  MemberAttributeName,
  MemberAttributeType,
  MemberEnrichmentAttributeName,
  MemberEnrichmentSource,
  MemberIdentityType,
  PlatformType,
} from '@crowd/types'
import { Logger, LoggerBase } from '@crowd/logging'

export default class EnrichmentServiceProgAI extends LoggerBase implements IEnrichmentService {
  public source: MemberEnrichmentSource = MemberEnrichmentSource.PROGAI

  public attributeSettings = {
    [MemberAttributeName.AVATAR_URL]: {
      fields: ['profile_pic_url'],
      default: true,
    },
    [MemberAttributeName.LOCATION]: {
      fields: ['location'],
      default: true,
    },
    [MemberAttributeName.BIO]: {
      fields: ['title', 'work_experiences[0].title'],
    },
    [MemberEnrichmentAttributeName.SENIORITY_LEVEL]: {
      fields: ['seniority_level'],
      type: MemberAttributeType.STRING,
    },
    [MemberEnrichmentAttributeName.COUNTRY]: {
      fields: ['country'],
      type: MemberAttributeType.STRING,
    },
    [MemberEnrichmentAttributeName.PROGRAMMING_LANGUAGES]: {
      fields: ['programming_languages'],
      type: MemberAttributeType.MULTI_SELECT,
    },
    [MemberEnrichmentAttributeName.LANGUAGES]: {
      fields: ['languages'],
      type: MemberAttributeType.MULTI_SELECT,
    },
    [MemberEnrichmentAttributeName.YEARS_OF_EXPERIENCE]: {
      fields: ['years_of_experience'],
      type: MemberAttributeType.NUMBER,
    },
    [MemberEnrichmentAttributeName.EXPERTISE]: {
      fields: ['expertise'],
      type: MemberAttributeType.MULTI_SELECT,
    },
    [MemberEnrichmentAttributeName.WORK_EXPERIENCES]: {
      fields: ['work_experiences'],
      type: MemberAttributeType.SPECIAL,
      fn: (workExperiences: IEnrichmentAPIWorkExperienceProgAI[]) =>
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
    [MemberEnrichmentAttributeName.EDUCATION]: {
      fields: ['educations'],
      type: MemberAttributeType.SPECIAL,
      fn: (educations: IEnrichmentAPIEducationProgAI[]) =>
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
    [MemberEnrichmentAttributeName.AWARDS]: {
      fields: ['awards'],
      type: MemberAttributeType.SPECIAL,
    },
    [MemberEnrichmentAttributeName.CERTIFICATIONS]: {
      fields: ['certifications'],
      type: MemberAttributeType.SPECIAL,
      fn: (certifications: IEnrichmentAPICertificationProgAI[]) =>
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

  async getData(input: IEnrichmentSourceInput): Promise<IEnrichmentDataProgAI> {
    let enriched: IEnrichmentDataProgAI = null

    // get data logic
    if (input.github) {
      try {
        enriched = await this.getDataUsingGitHubHandle(input.github.value)
      } catch (err) {
        throw new Error(err)
      }
    }

    if (this.alsoUseEmailIdentitiesForEnrichment) {
      if (!enriched && input.email) {
        try {
          enriched = await this.getDataUsingEmailAddress(input.email.value)
        } catch (err) {
          throw new Error(err)
        }
      }
    }

    return enriched
  }

  normalize(data: IEnrichmentDataProgAI): IEnrichmentDataNormalized {
    let normalized: IEnrichmentDataNormalized = {}
    normalized = this.fillPlatformData(data, normalized)
    normalized = this.fillAttributes(data, normalized)
    normalized = this.fillSkills(data, normalized)

    return normalized
  }

  private fillSkills(
    data: IEnrichmentDataProgAI,
    normalized: IEnrichmentDataNormalized,
  ): IEnrichmentDataNormalized {
    if (!normalized.attributes) {
      normalized.attributes = {}
    }

    if (data.skills) {
      if (!normalized.attributes.skills) {
        normalized.attributes.skills = {}
      }

      // Assign unique and ordered skills to 'member.attributes[MemberEnrichmentAttributeName.SKILLS].enrichment'
      normalized.attributes[MemberEnrichmentAttributeName.SKILLS].enrichment = lodash.uniq([
        // Use 'lodash.orderBy' to sort the skills by weight in descending order
        ...lodash
          .orderBy(data.skills || [], ['weight'], ['desc'])
          .map((s: IEnrichmentAPISkillsProgAI) => s.skill),
      ])
    }

    return normalized
  }

  private fillAttributes(
    data: IEnrichmentDataProgAI,
    normalized: IEnrichmentDataNormalized,
  ): IEnrichmentDataNormalized {
    if (!normalized.attributes) {
      normalized.attributes = {}
    }

    // eslint-disable-next-line guard-for-in
    for (const attributeName in this.attributeSettings) {
      const attribute = this.attributeSettings[attributeName]

      let value = null

      for (const field of attribute.fields) {
        if (value) {
          break
        }
        // Get value from 'enriched' object using the defined mapping and 'lodash.get'
        value = lodash.get(data, field)
      }

      if (value) {
        // Check if 'member.attributes[attributeName]' exists, and if it does not, initialize it as an empty object
        if (!normalized.attributes[attributeName]) {
          normalized.attributes[attributeName] = {}
        }

        // Check if 'attribute.fn' exists, otherwise set it the identity function
        const fn = attribute.fn || ((value) => value)
        value = fn(value)

        // Assign 'value' to 'member.attributes[attributeName].enrichment'
        normalized.attributes[attributeName].enrichment = value
      }
    }

    return normalized
  }

  private fillPlatformData(
    data: IEnrichmentDataProgAI,
    normalized: IEnrichmentDataNormalized,
  ): IEnrichmentDataNormalized {
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
              platform: 'enrichment',
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
      // Set 'member.username.github' to be equal to 'enriched.github_handle' (if it is not already set)
      normalized.identities.push({
        value: data.github_handle,
        type: MemberIdentityType.USERNAME,
        platform: PlatformType.GITHUB,
        verified: false,
      })
      if (!normalized.attributes.url) {
        // If it does not exist, initialize it as an empty object
        normalized.attributes.url = {}
      }

      // Set 'member.attributes.url.github' to be equal to a string concatenated with the 'github_handle' property
      normalized.attributes.url.github =
        normalized.attributes.url.github || `https://github.com/${enriched.github_handle}`
    }

    if (data.linkedin_url) {
      const linkedinHandle = data.linkedin_url.split('/').pop()
      normalized.identities.push({
        value: linkedinHandle,
        type: MemberIdentityType.USERNAME,
        platform: PlatformType.LINKEDIN,
        verified: false,
      })

      if (!normalized.attributes.url) {
        normalized.attributes.url = {}
      }

      normalized.attributes.url.linkedin = normalized.attributes.url.linkedin || data.linkedin_url
    }

    if (data.twitter_handle) {
      normalized.identities.push({
        value: data.twitter_handle,
        type: MemberIdentityType.USERNAME,
        platform: PlatformType.TWITTER,
        verified: false,
      })
      if (!normalized.attributes.url) {
        normalized.attributes.url = {}
      }
      normalized.attributes.url.twitter =
        normalized.attributes.url.twitter || `https://twitter.com/${data.twitter_handle}`
    }

    return normalized
  }

  async getDataUsingGitHubHandle(githubUsername: string): Promise<IEnrichmentDataProgAI> {
    let response: IEnrichmentDataProgAIResponse

    try {
      const url = `${process.env['CROWD_ENRICHMENT_URL']}/get_profile`
      const config = {
        method: 'get',
        url,
        params: {
          github_handle: githubUsername,
          with_emails: true,
          api_key: process.env['CROWD_ENRICHMENT_API_KEY'],
        },
        headers: {},
      }

      response = (await axios(config)).data
    } catch (err) {
      throw new Error(err)
    }

    return response.profile
  }

  async getDataUsingEmailAddress(email: string): Promise<IEnrichmentDataProgAI> {
    try {
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
      return response.profile
    } catch (err) {
      throw new Error(err)
    }
  }
}
