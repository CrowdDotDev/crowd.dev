import { LoggerBase } from '@crowd/logging'
import { RedisPubSubEmitter, getRedisClient } from '@crowd/redis'
import axios from 'axios'
import lodash from 'lodash'
import moment from 'moment'
import { i18n, Error400 } from '@crowd/common'
import {
  ApiWebsocketMessage,
  MemberAttributeName,
  MemberAttributeType,
  MemberEnrichmentAttributeName,
  MemberEnrichmentAttributes,
  PlatformType,
  OrganizationSource,
  SyncMode,
} from '@crowd/types'
import {
  EnrichmentAPICertification,
  EnrichmentAPIContribution,
  EnrichmentAPIEducation,
  EnrichmentAPIMember,
  EnrichmentAPIResponse,
  EnrichmentAPISkills,
  EnrichmentAPIWorkExperience,
} from '@crowd/types/premium'
import { ENRICHMENT_CONFIG, REDIS_CONFIG } from '../../../conf'
import { AttributeData } from '../../../database/attributes/attribute'
import MemberEnrichmentCacheRepository from '../../../database/repositories/memberEnrichmentCacheRepository'
import track from '../../../segment/track'
import { Member } from '../../../serverless/integrations/types/messageTypes'
import { IServiceOptions } from '../../IServiceOptions'
import MemberAttributeSettingsService from '../../memberAttributeSettingsService'
import MemberService from '../../memberService'
import OrganizationService from '../../organizationService'
import MemberRepository from '../../../database/repositories/memberRepository'
import OrganizationRepository from '../../../database/repositories/organizationRepository'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'
import SearchSyncService from '@/services/searchSyncService'

export default class MemberEnrichmentService extends LoggerBase {
  options: IServiceOptions

  attributes: AttributeData[] | undefined

  attributeSettings: any

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
    this.attributes = undefined

    // This code defines an object, attributeSettings, which maps specific member attributes to their corresponding fields within a data source, as well as their attribute type and any additional information needed for processing the attribute.
    // For example, the AVATAR_URL attribute maps to the profile_pic_url field in the data source and has a default value of true.
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
        type: MemberAttributeType.SPECIAL,
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
        type: MemberAttributeType.SPECIAL,
      },
      [MemberEnrichmentAttributeName.CERTIFICATIONS]: {
        fields: ['certifications'],
        type: MemberAttributeType.SPECIAL,
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

  async bulkEnrich(memberIds: string[], notifyFrontend: boolean = true) {
    const redis = await getRedisClient(REDIS_CONFIG, true)
    const searchSyncService = new SearchSyncService(this.options, SyncMode.ASYNCHRONOUS)

    const apiPubSubEmitter = new RedisPubSubEmitter(
      'api-pubsub',
      redis,
      (err) => {
        this.log.error({ err }, 'Error in api-ws emitter!')
      },
      this.log,
    )
    let enrichedMembers = 0
    for (const memberId of memberIds) {
      try {
        await this.enrichOne(memberId)
        enrichedMembers++
        await searchSyncService.triggerMemberSync(this.options.currentTenant.id, memberId)
        this.log.info(`Enriched member ${memberId}`)
      } catch (err) {
        if (
          err.message === i18n(this.options.language, 'enrichment.errors.noGithubHandleOrEmail')
        ) {
          this.log.warn(`Member ${memberId} has no GitHub handle or email address`)
          // eslint-disable-next-line no-continue
          continue
        } else {
          this.log.error(`Failed to enrich member ${memberId}`, err)
        }
      }
    }

    // Send websocket messages to frontend after all requests have been made
    // Only send error message if all enrichments failed
    if (notifyFrontend) {
      if (!enrichedMembers) {
        apiPubSubEmitter.emit(
          'user',
          new ApiWebsocketMessage(
            'bulk-enrichment',
            JSON.stringify({
              failedEnrichedMembers: memberIds.length - enrichedMembers,
              enrichedMembers,
              tenantId: this.options.currentTenant.id,
              success: false,
            }),
            undefined,
            this.options.currentTenant.id,
          ),
        )
      }
      // Send success message if there were enrichedMembers
      else {
        apiPubSubEmitter.emit(
          'user',
          new ApiWebsocketMessage(
            'bulk-enrichment',
            JSON.stringify({
              enrichedMembers,
              tenantId: this.options.currentTenant.id,
              success: true,
            }),
            undefined,
            this.options.currentTenant.id,
          ),
        )
      }
    }

    return { enrichedMemberCount: enrichedMembers }
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
    const transaction = await SequelizeRepository.createTransaction(this.options)
    const options = {
      ...this.options,
      transaction,
    }

    try {
      // If the attributes have not been fetched yet, fetch them
      if (!this.attributes) {
        await this.getAttributes()
      }

      const searchSyncService = new SearchSyncService(this.options, SyncMode.ASYNCHRONOUS)

      // Create an instance of the MemberService and use it to look up the member
      const memberService = new MemberService(options)
      const member = await memberService.findById(memberId, false, false)

      // If the member's GitHub handle or email address is not available, throw an error
      if (!member.username[PlatformType.GITHUB] && member.emails.length === 0) {
        throw new Error400(this.options.language, 'enrichment.errors.noGithubHandleOrEmail')
      }

      let enrichedFrom = ''
      let enrichmentData: EnrichmentAPIMember
      // If the member has a GitHub handle, use it to make a request to the Enrichment API
      if (member.username[PlatformType.GITHUB]) {
        enrichedFrom = 'github'
        enrichmentData = await this.getEnrichmentByGithubHandle(
          member.username[PlatformType.GITHUB][0],
        )
      } else if (member.emails.length > 0) {
        enrichedFrom = 'email'
        // If the member has an email address, use it to make a request to the Enrichment API
        enrichmentData = await this.getEnrichmentByEmail(member.emails[0])
      }

      if (!enrichmentData) {
        await SequelizeRepository.commitTransaction(transaction)
        return null
      }

      // To preserve the original member object, creating a deep copy
      const memberCopy = JSON.parse(JSON.stringify(member))
      const normalized = await this.normalize(memberCopy, enrichmentData)

      if (normalized.username) {
        const filteredUsername = Object.keys(normalized.username).reduce((obj, key) => {
          if (!member.username[key]) {
            obj[key] = normalized.username[key]
          }
          return obj
        }, {})

        for (const [platform, usernames] of Object.entries(filteredUsername)) {
          const usernameArray = Array.isArray(usernames) ? usernames : [usernames]

          for (const username of usernameArray) {
            // Check if a member with this username already exists
            const existingMember = await memberService.memberExists(username, platform)

            if (existingMember) {
              // add the member to merge suggestions
              await MemberRepository.addToMerge(
                [{ similarity: 0.9, members: [memberId, existingMember.id] }],
                options,
              )

              if (Array.isArray(normalized.username[platform])) {
                // Filter out the identity that belongs to another member from the normalized payload
                normalized.username[platform] = normalized.username[platform].filter(
                  (u) => u !== username,
                )
              } else if (typeof normalized.username[platform] === 'string') {
                delete normalized.username[platform]
              } else {
                throw new Error(
                  `Unsupported data type for normalized.username[platform] "${normalized.username[platform]}".`,
                )
              }
            }
          }
        }
      }

      // save raw data to cache
      await MemberEnrichmentCacheRepository.upsert(memberId, enrichmentData, options)

      // We are updating the displayName only if the existing one has one word only
      // And we are using an update here instead of the upsert because
      // upsert always takes the existing displayName
      if (!/\W/.test(member.displayName)) {
        if (enrichmentData.first_name && enrichmentData.last_name) {
          await memberService.update(
            member.id,
            {
              displayName: `${enrichmentData.first_name} ${enrichmentData.last_name}`,
            },
            false,
          )
        }
      }

      track(
        'Member Enriched',
        {
          memberId: member.id,
          enrichedFrom,
        },
        options,
      )

      let result = await memberService.upsert(
        {
          ...normalized,
          platform: Object.keys(member.username)[0],
        },
        false,
        true,
        false,
      )

      // for every work experience in `enrichmentData`
      //   - upsert organization
      //   - upsert `memberOrganization` relation
      const organizationService = new OrganizationService(options)
      if (enrichmentData.work_experiences) {
        for (const workExperience of enrichmentData.work_experiences) {
          const org = await organizationService.createOrUpdate(
            {
              identities: [
                {
                  name: workExperience.company,
                  platform: PlatformType.ENRICHMENT,
                },
              ],
            },
            {
              doSync: true,
              mode: SyncMode.ASYNCHRONOUS,
            },
          )

          const dateEnd = workExperience.endDate
            ? moment.utc(workExperience.endDate).toISOString()
            : null

          const data = {
            memberId: result.id,
            organizationId: org.id,
            title: workExperience.title,
            dateStart: workExperience.startDate,
            dateEnd,
            source: OrganizationSource.ENRICHMENT,
          }
          await MemberRepository.createOrUpdateWorkExperience(data, options)
          await OrganizationRepository.includeOrganizationToSegments(org.id, options)
        }
      }

      await searchSyncService.triggerMemberSync(this.options.currentTenant.id, result.id)

      result = await memberService.findById(result.id, true, false)
      await SequelizeRepository.commitTransaction(transaction)
      return result
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async normalize(member: Member, enrichmentData: EnrichmentAPIMember) {
    member.lastEnriched = new Date()

    const enrichedBy = new Set<string>(member.enrichedBy).add(this.options.currentUser.id)
    member.enrichedBy = Array.from(enrichedBy)

    if (enrichmentData.emails.length > 0) {
      const emailSet = new Set<string>(
        enrichmentData.emails.filter((email) => !email.includes('noreply.github')),
      )
      member.emails.forEach((email) => emailSet.add(email))
      member.emails = Array.from(emailSet)
    }

    member.contributions = enrichmentData.oss_contributions?.map(
      (contribution: EnrichmentAPIContribution) => ({
        id: contribution.id,
        topics: contribution.topics,
        summary: contribution.summary,
        url: contribution.github_url,
        firstCommitDate: contribution.first_commit_date,
        lastCommitDate: contribution.last_commit_date,
        numberCommits: contribution.num_of_commits,
      }),
    )
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
  // eslint-disable-next-line class-methods-use-this
  fillPlatformData(member: Member, enrichmentData: EnrichmentAPIMember) {
    if (enrichmentData.github_handle) {
      // Set 'member.username.github' to be equal to 'enrichmentData.github_handle' (if it is not already set)
      member.username[PlatformType.GITHUB] =
        member.username[PlatformType.GITHUB] || enrichmentData.github_handle
      if (!member.attributes.url) {
        // If it does not exist, initialize it as an empty object
        member.attributes.url = {}
      }
      // Set 'member.attributes.url.github' to be equal to a string concatenated with the 'github_handle' property
      member.attributes.url.github =
        member.attributes.url.github || `https://github.com/${enrichmentData.github_handle}`
    }

    if (enrichmentData.linkedin_url) {
      member.username[PlatformType.LINKEDIN] =
        member.username[PlatformType.LINKEDIN] || enrichmentData.linkedin_url.split('/').pop()

      if (!member.attributes.url) {
        member.attributes.url = {}
      }

      member.attributes.url.linkedin = member.attributes.url.linkedin || enrichmentData.linkedin_url
    }

    if (enrichmentData.twitter_handle) {
      member.username[PlatformType.TWITTER] =
        member.username[PlatformType.TWITTER] || enrichmentData.twitter_handle

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

    // eslint-disable-next-line guard-for-in
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
    // Check if 'enrichmentData.skills' properties exists
    if (enrichmentData.skills) {
      if (!member.attributes.skills) {
        member.attributes.skills = {}
      }

      // Assign unique and ordered skills to 'member.attributes[MemberEnrichmentAttributeName.SKILLS].enrichment'
      member.attributes[MemberEnrichmentAttributeName.SKILLS].enrichment = lodash.uniq([
        // Use 'lodash.orderBy' to sort the skills by weight in descending order
        ...lodash
          .orderBy(enrichmentData.skills || [], ['weight'], ['desc'])
          .map((s: EnrichmentAPISkills) => s.skill),
      ])

      await this.createAttributeAndUpdateOptions(
        MemberEnrichmentAttributeName.SKILLS,
        { type: MemberAttributeType.MULTI_SELECT },
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
      attribute.type === MemberAttributeType.MULTI_SELECT &&
      lodash.find(this.attributes, { name: attributeName })
    ) {
      // Find attributeSettings by name
      const attributeSettings = lodash.find(this.attributes, { name: attributeName })
      // Get options
      const options = attributeSettings.options || []
      // Update options
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
        show: attributeName !== MemberEnrichmentAttributeName.EMAILS,
        canDelete: false,
        ...(attribute.type === MemberAttributeType.MULTI_SELECT && { options: value }),
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

      if (response.error || response.profile === undefined || !response.profile) {
        this.log.error(githubHandle, `Member not found using github handle.`)
        throw new Error400(this.options.language, 'enrichment.errors.memberNotFound')
      }
      return response.profile
    } catch (error) {
      // Log the error and throw a custom error
      this.log.error({ error, githubHandle }, 'Enrichment failed')
      throw error
    }
  }

  /**
   * This function is used to get an enrichment profile for a given email.
   * It makes a GET request to the Enrichment API with the provided email and an API key,
   * and returns the profile data from the API response.
   * If the request fails, it logs the error and throws a custom error.
   * @param email - the email of the member to get the enrichment profile for
   * @returns a promise that resolves to the enrichment profile for the given email
   */
  async getEnrichmentByEmail(email: string): Promise<EnrichmentAPIMember> {
    try {
      // Construct the API url and the config for the GET request
      const url = `${ENRICHMENT_CONFIG.url}/get_profile`
      const config = {
        method: 'get',
        url,
        params: {
          email,
          with_emails: true,
          api_key: ENRICHMENT_CONFIG.apiKey,
        },
        headers: {},
      }
      // Make the GET request and extract the profile data from the response
      const response: EnrichmentAPIResponse = (await axios(config)).data
      if (response.error || !response.profile) {
        this.log.error(email, `Member not found using email.`)
        throw new Error400(this.options.language, 'enrichment.errors.memberNotFound')
      }
      return response.profile
    } catch (error) {
      // Log the error and throw a custom error
      this.log.error({ error, email }, 'Enrichment failed')
      throw error
    }
  }
}
