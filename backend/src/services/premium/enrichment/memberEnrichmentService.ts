import axios from 'axios'
import lodash from 'lodash'
import { IServiceOptions } from '../../IServiceOptions'
import { LoggingBase } from '../../loggingBase'
import {
  EnrichmentAPIResponse,
  EnrichmentAPIMember,
  EnrichmentAPIContribution,
  EnrichmentAPISkills,
  EnrichmentAPIEducation,
  EnrichmentAPICertification,
  EnrichmentAPIWorkExperience,
} from './types/memberEnrichmentTypes'
import { ENRICHMENT_CONFIG } from '../../../config'
import Error400 from '../../../errors/Error400'
import MemberService from '../../memberService'
import { PlatformType } from '../../../types/integrationEnums'
import MemberAttributeSettingsService from '../../memberAttributeSettingsService'
import { AttributeData } from '../../../database/attributes/attribute'
import { Member } from '../../../serverless/integrations/types/messageTypes'
import {
  MemberAttributeName,
  MemberEnrichmentAttributeName,
  MemberEnrichmentAttributes,
} from '../../../database/attributes/member/enums'
import { AttributeType } from '../../../database/attributes/types'
import { i18n } from '../../../i18n'
import RedisPubSubEmitter from '../../../utils/redis/pubSubEmitter'
import { createRedisClient } from '../../../utils/redis'
import { ApiWebsocketMessage } from '../../../types/mq/apiWebsocketMessage'

export default class MemberEnrichmentService extends LoggingBase {
  options: IServiceOptions
  attributes: AttributeData[] | undefined
  attributeSettings: any

  constructor(options) {
    super(options)
    this.options = options
    this.attributes = undefined

    // This code defines an object, attributeSettings, which maps specific member attributes to their corresponding fields within a data source, as well as their attribute type and any additional information needed for processing the attribute.
    // For example, the AVATAR_URL attribute maps to the profile_pic_url field in the data source and has a default value of true. The EMAILS attribute maps to the emails field in the data source, has a type of AttributeType.MULTI_SELECT, and a function that filters out emails with "noreply.github" in them.
    // The object is used to define the fields, types and any additional information needed for processing the member attributes.
    this.attributeSettings = {
      [MemberAttributeName.AVATAR_URL]: {
        fields: ['profile_pic_url'],
        default: true,
      },
      [MemberAttributeName.LOCATION]: {
        fields: ['location'],
        default: true,
      },
      [MemberAttributeName.JOB_TITLE]: {
        fields: ['title', 'work_experiences[0].title'],
        default: true,
      },
      [MemberEnrichmentAttributeName.SENIORITY_LEVEL]: {
        fields: ['seniority_level'],
        type: AttributeType.STRING,
      },
      [MemberEnrichmentAttributeName.EMAILS]: {
        fields: ['emails'],
        type: AttributeType.MULTI_SELECT,
        fn: (emails: string[]) =>
          lodash.filter(emails, (email) => !email.includes('noreply.github')),
      },
      [MemberEnrichmentAttributeName.COUNTRY]: {
        fields: ['country'],
        type: AttributeType.STRING,
      },
      [MemberEnrichmentAttributeName.PROGRAMMING_LANGUAGES]: {
        fields: ['programming_languages'],
        type: AttributeType.MULTI_SELECT,
      },
      [MemberEnrichmentAttributeName.LANGUAGES]: {
        fields: ['languages'],
        type: AttributeType.MULTI_SELECT,
      },
      [MemberEnrichmentAttributeName.YEARS_OF_EXPERIENCE]: {
        fields: ['years_of_experience'],
        type: AttributeType.NUMBER,
      },
      [MemberEnrichmentAttributeName.WORK_EXPERIENCES]: {
        fields: ['work_experiences'],
        type: AttributeType.SPECIAL,
        fn: (workExperiences: EnrichmentAPIWorkExperience[]) =>
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
        type: AttributeType.SPECIAL,
        fn: (educations: EnrichmentAPIEducation[]) =>
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
        type: AttributeType.SPECIAL,
      },
      [MemberEnrichmentAttributeName.CERTIFICATIONS]: {
        fields: ['certifications'],
        type: AttributeType.SPECIAL,
        fn: (certifications: EnrichmentAPICertification[]) =>
          certifications.map((certification) => {
            const { title, description } = certification
            return {
              title,
              description,
            }
          }),
      },
    }
  }

  async getAttributes() {
    const memberAttributeSettingsService = new MemberAttributeSettingsService(this.options)
    this.attributes = (await memberAttributeSettingsService.findAndCountAll({})).rows
  }

  async bulkEnrich(memberIds: string[]) {
    const redis = await createRedisClient(true)

    const apiPubSubEmitter = new RedisPubSubEmitter('api-pubsub', redis, (err) => {
      this.log.error({ err }, 'Error in api-ws emitter!')
    })
    let enrichedMembers = 0
    for (const memberId of memberIds) {
      try {
        await this.enrichOne(memberId)
        enrichedMembers++
        this.log.info(`Enriched member ${memberId}`)
      } catch (err) {
        if (
          err.message === i18n(this.options.language, 'enrichment.errors.noGithubHandleOrEmail')
        ) {
          this.log.warn(`Member ${memberId} has no GitHub handle or email address`)
          continue
        } else {
          this.log.error(`Failed to enrich member ${memberId}`, err)
          apiPubSubEmitter.emit(
            'user',
            new ApiWebsocketMessage(
              'bulk-enrichment',
              JSON.stringify({
                enrichedMembers,
                success: false,
              }),
              undefined,
              this.options.currentTenant.id,
            ),
          )
        }
      }
    }

    // Send websocket message to frontend
    apiPubSubEmitter.emit(
      'user',
      new ApiWebsocketMessage(
        'bulk-enrichment',
        JSON.stringify({
          enrichedMembers,
          success: true,
        }),
        undefined,
        this.options.currentTenant.id,
      ),
    )
  }

  /**
   * This function is used to enrich a member's profile with data from the Enrichment API.
   * It first looks up the member using the provided member ID and MemberService.
   * If the member's GitHub handle or email address is not available, an error is thrown.
   * If the member's GitHub handle is available, it is used to make a request to the Enrichment API
   * and the returned data is returned.
   * @param memberId - the ID of the member to enrich
   * @returns a promise that resolves to the enrichment data for the member
   */
  async enrichOne(memberId) {
    // If the attributes have not been fetched yet, fetch them
    if (!this.attributes) {
      await this.getAttributes()
    }

    // Create an instance of the MemberService and use it to look up the member
    const memberService = new MemberService(this.options)
    const member = await memberService.findById(memberId)

    // If the member's GitHub handle or email address is not available, throw an error
    if (!(member.username[PlatformType.GITHUB] || member.email)) {
      throw new Error400(this.options.language, 'enrichment.errors.noGithubHandleOrEmail')
    }

    let enrichmentData: EnrichmentAPIMember
    // If the member has a GitHub handle, use it to make a request to the Enrichment API
    if (member.username[PlatformType.GITHUB]) {
      enrichmentData = await this.getEnrichmentByGithubHandle(member.username[PlatformType.GITHUB])
      const normalized = await this.normalize(member, enrichmentData)
      return await memberService.upsert({ ...normalized, platform: PlatformType.GITHUB })
    }
  }

  async normalize(member: Member, enrichmentData: EnrichmentAPIMember) {
    member.lastEnriched = new Date()
    if (!member.email && enrichmentData.primary_mail) {
      member.email = enrichmentData.primary_mail
    }
    if (!/\W/.test(member.displayName)) {
      if (enrichmentData.first_name && enrichmentData.last_name) {
        member.displayName = `${enrichmentData.first_name} ${enrichmentData.last_name}`
      }
    }
    member = this.fillPlatformData(member, enrichmentData)
    member = await this.fillAttributes(member, enrichmentData)
    member = await this.fillSkills(member, enrichmentData)
    return member
  }

  /**
   * This function is used to fill in a member's social media handles and profile links based on data obtained from an external API
   * @param member - The object that contains properties such as 'username' and 'attributes'
   * @param enrichmentData - An object that contains data obtained from an external API
   * @returns the updated 'member' object
   */
  fillPlatformData(member: Member, enrichmentData: EnrichmentAPIMember) {
    if (enrichmentData.github_handle) {
      // Set 'member.username.github' to be equal to 'enrichmentData.github_handle' (if it is not already set)
      member.username.github = member.username.github || enrichmentData.github_handle
      if (!member.attributes.url) {
        // If it does not exist, initialize it as an empty object
        member.attributes.url = {}
      }
      // Set 'member.attributes.url.github' to be equal to a string concatenated with the 'github_handle' property
      member.attributes.url.github =
        member.attributes.url.github || `https://github.com/${enrichmentData.github_handle}`
    }

    if (enrichmentData.linkedin_url) {
      member.username.linkedin =
        member.username.linkedin || enrichmentData.linkedin_url.split('/').pop()

      if (!member.attributes.url) {
        member.attributes.url = {}
      }

      member.attributes.url.linkedin = member.attributes.url.linkedin || enrichmentData.linkedin_url
    }

    if (enrichmentData.twitter_handle) {
      member.username.twitter = member.username.twitter || enrichmentData.twitter_handle

      if (!member.attributes.url) {
        member.attributes.url = {}
      }
      member.attributes.url.twitter =
        member.attributes.url.twitter || `https://twitter.com/${enrichmentData.twitter_handle}`
    }

    return member
  }

  /**
   * This function is used to fill in a member's attributes based on data obtained from an external API
   * @param member - The object that contains properties such as 'attributes'
   * @param enrichmentData - An object that contains data obtained from an external API
   * @returns the updated 'member' object
   */
  async fillAttributes(member: Member, enrichmentData: EnrichmentAPIMember) {
    // Check if 'member.attributes' property exists
    if (!member.attributes) {
      // If it does not exist, initialize it as an empty object
      member.attributes = {}
    }

    for (const attributeName in this.attributeSettings) {
      const attribute = this.attributeSettings[attributeName]

      let value = null

      for (const field of attribute.fields) {
        if (value) {
          break
        }
        // Get value from 'enrichmentData' object using the defined mapping and 'lodash.get'
        value = lodash.get(enrichmentData, field)
      }

      if (value) {
        // Check if 'member.attributes[attributeName]' exists, and if it does not, initialize it as an empty object
        if (!member.attributes[attributeName]) {
          member.attributes[attributeName] = {}
        }

        // Check if 'attribute.fn' exists, otherwise set it the identity function
        const fn = attribute.fn || ((value) => value)
        value = fn(value)

        // Assign 'value' to 'member.attributes[attributeName].enrichment'
        member.attributes[attributeName].enrichment = value

        await this.createAttributeAndUpdateOptions(attributeName, attribute, value)
      }
    }
    return member
  }

  /**
   * This function is used to fill in a member's skills based on data obtained from an external API
   * @param member - The object that contains properties such as 'attributes'
   * @param enrichmentData - An object that contains data obtained from an external API
   * @returns the updated 'member' object
   */
  async fillSkills(member: Member, enrichmentData: EnrichmentAPIMember) {
    // Check if 'enrichmentData.skills' or 'enrichmentData.expertise' properties exist
    if (enrichmentData.skills || enrichmentData.expertise) {
      if (!member.attributes.skills) {
        member.attributes.skills = {}
      }

      // Assign unique and ordered skills to 'member.attributes[MemberEnrichmentAttributeName.SKILLS].enrichment'
      member.attributes[MemberEnrichmentAttributeName.SKILLS].enrichment = lodash.uniq([
        ...(enrichmentData.expertise || []),
        // Use 'lodash.orderBy' to sort the skills by weight in descending order
        ...lodash
          .orderBy(enrichmentData.skills || [], ['weight'], ['desc'])
          .map((s: EnrichmentAPISkills) => s.skill),
      ])

      await this.createAttributeAndUpdateOptions(
        MemberEnrichmentAttributeName.SKILLS,
        { type: AttributeType.MULTI_SELECT },
        member.attributes.skills.enrichment,
      )
    }

    return member
  }

  /**
   * This function is used to create new attribute and update options for member's attributes
   * @param attributeName - The name of the attribute
   * @param attribute - The attribute object
   * @param value - the value of the attribute
   */
  async createAttributeAndUpdateOptions(attributeName, attribute, value) {
    // Check if attribute type is 'MULTI_SELECT' and the attribute already exists
    if (
      attribute.type === AttributeType.MULTI_SELECT &&
      lodash.find(this.attributes, { name: attributeName })
    ) {
      // Find attributeSettings by name
      const attributeSettings = lodash.find(this.attributes, { name: attributeName })
      // Get options
      const options = attributeSettings.options || []
      //Update options
      await new MemberAttributeSettingsService(this.options).update(attributeSettings.id, {
        options: lodash.uniq([...options, ...value]),
      })
    }

    // Check if the attribute does not exist and it is not a default attribute
    if (!(lodash.find(this.attributes, { name: attributeName }) || attribute.default)) {
      // Create new attribute if it does not exist
      this.attributes[attributeName] = await new MemberAttributeSettingsService(
        this.options,
      ).create({
        name: attributeName,
        label: MemberEnrichmentAttributes[attributeName].label,
        type: attribute.type,
        show: true,
        canDelete: false,
        ...(attribute.type === AttributeType.MULTI_SELECT && { options: value }),
      })
    }
  }

  /**
   * This function is used to get an enrichment profile for a given GitHub handle.
   * It makes a GET request to the Enrichment API with the provided GitHub handle and an API key,
   * and returns the profile data from the API response.
   * If the request fails, it logs the error and throws a custom error.
   * @param githubHandle - the GitHub handle of the member to get the enrichment profile for
   * @returns a promise that resolves to the enrichment profile for the given GitHub handle
   */
  async getEnrichmentByGithubHandle(githubHandle: number): Promise<EnrichmentAPIMember> {
    try {
      // Construct the API url and the config for the GET request
      const url = `${ENRICHMENT_CONFIG.url}/get_profile`
      const config = {
        method: 'get',
        url,
        params: {
          github_handle: githubHandle,
          with_emails: true,
          api_key: ENRICHMENT_CONFIG.apiKey,
        },
        headers: {},
      }
      // Make the GET request and extract the profile data from the response
      const response: EnrichmentAPIResponse = (await axios(config)).data
      return response.profile
    } catch (error) {
      // Log the error and throw a custom error
      this.log.error({ error, githubHandle }, 'Enrichment failed')
      throw new Error400(this.options.language, 'enrichment.errors.enrichmentFailed')
    }
  }
}
