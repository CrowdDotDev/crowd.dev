/* eslint-disable no-continue */

import moment from 'moment-timezone'
import lodash from 'lodash'
import validator from 'validator'
import Error400 from '../errors/Error400'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { IServiceOptions } from './IServiceOptions'
import merge from './helpers/merge'
import MemberRepository from '../database/repositories/memberRepository'
import ActivityRepository from '../database/repositories/activityRepository'
import TagRepository from '../database/repositories/tagRepository'
import telemetryTrack from '../segment/telemetryTrack'
import MemberAttributeSettingsRepository from '../database/repositories/memberAttributeSettingsRepository'
import MemberAttributeSettingsService from './memberAttributeSettingsService'
import SettingsService from './settingsService'
import OrganizationService from './organizationService'
import {
  sendExportCSVNodeSQSMessage,
  sendNewMemberNodeSQSMessage,
} from '../serverless/utils/nodeWorkerSQS'
import { LoggingBase } from './loggingBase'
import { ExportableEntity } from '../serverless/microservices/nodejs/messageTypes'
import { AttributeType } from '../database/attributes/types'
import {
  IActiveMemberFilter,
  mapUsernameToIdentities,
  IMemberMergeSuggestion,
  IMemberMergeSuggestionsType,
} from '../database/repositories/types/memberTypes'
import { IRepositoryOptions } from '../database/repositories/IRepositoryOptions'

export default class MemberService extends LoggingBase {
  options: IServiceOptions

  constructor(options) {
    super(options)
    this.options = options
  }

  /**
   * Validates the attributes against its saved settings.
   *
   * Throws 400 Errors if the attribute does not exist in settings,
   * or if the sent attribute type does not match the type in the settings.
   * Also restructures custom attributes that come only as a value, without platforms.
   *
   * Example custom attributes restructuring
   * {
   *   attributes: {
   *      someAttributeName: 'someValue'
   *   }
   * }
   *
   * This object is transformed into:
   * {
   *   attributes: {
   *     someAttributeName: {
   *        custom: 'someValue'
   *     },
   *   }
   * }
   *
   * @param attributes
   * @returns restructured object
   */
  async validateAttributes(
    attributes: { [key: string]: any },
    transaction = null,
  ): Promise<object> {
    // check attribute exists in memberAttributeSettings

    const memberAttributeSettings = (
      await MemberAttributeSettingsRepository.findAndCountAll(
        {},
        { ...this.options, ...(transaction && { transaction }) },
      )
    ).rows.reduce((acc, attribute) => {
      acc[attribute.name] = attribute
      return acc
    }, {})

    for (const attributeName of Object.keys(attributes)) {
      if (!memberAttributeSettings[attributeName]) {
        this.log.error('Attribute does not exist', {
          attributeName,
          attributes,
        })
        delete attributes[attributeName]
        continue
      }
      if (typeof attributes[attributeName] !== 'object') {
        attributes[attributeName] = {
          custom: attributes[attributeName],
        }
      }

      for (const platform of Object.keys(attributes[attributeName])) {
        if (
          attributes[attributeName][platform] !== undefined &&
          attributes[attributeName][platform] !== null
        ) {
          if (
            !MemberAttributeSettingsService.isCorrectType(
              attributes[attributeName][platform],
              memberAttributeSettings[attributeName].type,
              { options: memberAttributeSettings[attributeName].options },
            )
          ) {
            this.log.error('Failed to validate attributee', {
              attributeName,
              platform,
              attributeValue: attributes[attributeName][platform],
              attributeType: memberAttributeSettings[attributeName].type,
              options: memberAttributeSettings[attributeName].options,
            })
            throw new Error400(
              this.options.language,
              'settings.memberAttributes.wrongType',
              attributeName,
              memberAttributeSettings[attributeName].type,
            )
          }
        }
      }
    }

    return attributes
  }

  /**
   * Sets the attribute.default key as default values of attribute
   * object using the priority array stored in the settings.
   * Throws a 400 Error if priority array does not exist.
   * @param attributes
   * @returns attribute object with default values
   */
  async setAttributesDefaultValues(attributes: object): Promise<object> {
    if (!(await SettingsService.platformPriorityArrayExists(this.options))) {
      throw new Error400(this.options.language, 'settings.memberAttributes.priorityArrayNotFound')
    }

    const priorityArray = this.options.currentTenant.settings[0].get({ plain: true })
      .attributeSettings.priorities

    for (const attributeName of Object.keys(attributes)) {
      const highestPriorityPlatform = MemberService.getHighestPriorityPlatformForAttributes(
        Object.keys(attributes[attributeName]),
        priorityArray,
      )

      if (highestPriorityPlatform !== undefined) {
        attributes[attributeName].default = attributes[attributeName][highestPriorityPlatform]
      } else {
        delete attributes[attributeName]
      }
    }

    return attributes
  }

  /**
   * Returns the highest priority platform from an array of platforms
   * If any of the platforms does not exist in the priority array, returns
   * the first platform sent as the highest priority platform.
   * @param platforms Array of platforms to select the highest priority platform
   * @param priorityArray zero indexed priority array. Lower index means higher priority
   * @returns the highest priority platform or undefined if values are incorrect
   */
  public static getHighestPriorityPlatformForAttributes(
    platforms: string[],
    priorityArray: string[],
  ): string | undefined {
    if (platforms.length <= 0) {
      return undefined
    }
    const filteredPlatforms = priorityArray.filter((i) => platforms.includes(i))
    return filteredPlatforms.length > 0 ? filteredPlatforms[0] : platforms[0]
  }

  /**
   * Upsert a member. If the member exists, it updates it. If it does not exist, it creates it.
   * The update is done with a deep merge of the original and the new member.
   * The member is returned without relations
   * Only the fields that have changed are updated.
   * @param data Data for the member
   * @param existing If the member already exists. If it does not, false. Othwerwise, the member.
   * @returns The created member
   */
  async upsert(data, existing: boolean | any = false) {
    const logger = this.options.log

    const errorDetails: any = {}

    if (!('platform' in data)) {
      throw new Error400(this.options.language, 'activity.platformRequiredWhileUpsert')
    }

    data.username = mapUsernameToIdentities(data.username, data.platform)

    if (!(data.platform in data.username)) {
      throw new Error400(this.options.language, 'activity.platformAndUsernameNotMatching')
    }

    if (!data.displayName) {
      data.displayName = data.username[data.platform][0].username
    }

    if (!(data.platform in data.username)) {
      throw new Error400(this.options.language, 'activity.platformAndUsernameNotMatching')
    }

    if (!data.displayName) {
      data.displayName = data.username[data.platform].username
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      if (data.activities) {
        data.activities = await ActivityRepository.filterIdsInTenant(data.activities, {
          ...this.options,
          transaction,
        })
      }
      if (data.tags) {
        data.tags = await TagRepository.filterIdsInTenant(data.tags, {
          ...this.options,
          transaction,
        })
      }
      if (data.noMerge) {
        data.noMerge = await MemberRepository.filterIdsInTenant(data.noMerge, {
          ...this.options,
          transaction,
        })
      }
      if (data.toMerge) {
        data.toMerge = await MemberRepository.filterIdsInTenant(data.toMerge, {
          ...this.options,
          transaction,
        })
      }

      const { platform } = data

      if (data.attributes) {
        data.attributes = await this.validateAttributes(data.attributes, transaction)
      }

      if (data.reach) {
        data.reach = typeof data.reach === 'object' ? data.reach : { [platform]: data.reach }
        data.reach = MemberService.calculateReach(data.reach, {})
      } else {
        data.reach = { total: -1 }
      }

      delete data.platform

      if (!('joinedAt' in data)) {
        data.joinedAt = moment.tz('Europe/London').toDate()
      }

      if (!existing) {
        existing = await this.memberExists(data.username, platform)
      } else {
        // let's look just in case for an existing member and if they are different we should log them because they will probably fail to insert
        const tempExisting = await this.memberExists(data.username, platform)

        if (!tempExisting) {
          logger.warn(
            { existingMemberId: existing.id },
            'We have received an existing member but actually we could not find him by username and platform!',
          )
          errorDetails.reason = 'member_service_upsert_existing_member_not_found'
          errorDetails.details = {
            existingMemberId: existing.id,
            username: data.username,
            platform,
          }
        } else if (existing.id !== tempExisting.id) {
          logger.warn(
            { existingMemberId: existing.id, actualExistingMemberId: tempExisting.id },
            'We found a member with the same username and platform but different id!',
          )
          errorDetails.reason = 'member_service_upsert_existing_member_mismatch'
          errorDetails.details = {
            existingMemberId: existing.id,
            actualExistingMemberId: tempExisting.id,
            username: data.username,
            platform,
          }
        }
      }

      // If organizations are sent
      if (data.organizations) {
        // Collect IDs for relation
        const organizationsIds = []
        for (const organization of data.organizations) {
          if (typeof organization === 'string' && validator.isUUID(organization)) {
            // If an ID was already sent, we simply push it to the list
            organizationsIds.push(organization)
          } else {
            // Otherwise, either another string or an object was sent
            const organizationService = new OrganizationService(this.options)
            let data = {}
            if (typeof organization === 'string') {
              // If a string was sent, we assume it is the name of the organization
              data = { name: organization }
            } else {
              // Otherwise, we assume it is an object with the data of the organization
              data = organization
            }
            // We findOrCreate the organization and add it to the list of IDs
            const organizationRecord = await organizationService.findOrCreate(data)
            organizationsIds.push(organizationRecord.id)
          }
        }
        // Remove dups
        data.organizations = [...new Set(organizationsIds)]
      }

      const fillRelations = false

      let record
      if (existing) {
        const { id } = existing
        delete existing.id
        const toUpdate = MemberService.membersMerge(existing, data)

        if (toUpdate.attributes) {
          toUpdate.attributes = await this.setAttributesDefaultValues(toUpdate.attributes)
        }

        // It is important to call it with doPopulateRelations=false
        // because otherwise the performance is greatly decreased in integrations
        record = await MemberRepository.update(
          id,
          toUpdate,
          {
            ...this.options,
            transaction,
          },
          fillRelations,
        )
      } else {
        // It is important to call it with doPopulateRelations=false
        // because otherwise the performance is greatly decreased in integrations
        if (data.attributes) {
          data.attributes = await this.setAttributesDefaultValues(data.attributes)
        }

        record = await MemberRepository.create(
          data,
          {
            ...this.options,
            transaction,
          },
          fillRelations,
        )

        telemetryTrack(
          'Member created',
          {
            id: record.id,
            createdAt: record.createdAt,
            sample: record.attributes.sample?.crowd,
            identities: Object.keys(record.username),
          },
          this.options,
        )
      }

      await SequelizeRepository.commitTransaction(transaction)

      if (!existing) {
        try {
          await sendNewMemberNodeSQSMessage(this.options.currentTenant.id, record)
        } catch (err) {
          logger.error(err, `Error triggering new member automation - ${record.id}!`)
        }
      }

      return record
    } catch (error) {
      const reason = errorDetails.reason || undefined
      const details = errorDetails.details || undefined

      if (error.name && error.name.includes('Sequelize')) {
        logger.error(
          error,
          {
            query: error.sql,
            errorMessage: error.original.message,
            reason,
            details,
          },
          'Error during member upsert!',
        )
      } else {
        logger.error(error, { reason, details }, 'Error during member upsert!')
      }

      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'member')

      throw { ...error, reason, details }
    }
  }

  /**
   * Checks if given user already exists by username and platform.
   * Username can be given as a plain string or as dictionary with
   * related platforms.
   * Ie:
   * username = 'anil' || username = { github: 'anil' } || username = { github: 'anil', twitter: 'some-other-username' } || username = { github: { username: 'anil' } } || username = { github: [{ username: 'anil' }] }
   * @param username username of the member
   * @param platform platform of the member
   * @returns null | found member
   */
  async memberExists(username: object | string, platform: string) {
    const fillRelations = false

    const usernames: string[] = []

    if (typeof username === 'string') {
      usernames.push(username)
    } else if (typeof username === 'object') {
      if ('username' in username) {
        usernames.push((username as any).username)
      } else if (platform in username) {
        if (typeof username[platform] === 'string') {
          usernames.push(username[platform])
        } else if (Array.isArray(username[platform])) {
          if (username[platform].length === 0) {
            throw new Error400(this.options.language, 'activity.platformAndUsernameNotMatching')
          } else if (typeof username[platform] === 'string') {
            usernames.push(...username[platform])
          } else if (typeof username[platform][0] === 'object') {
            usernames.push(...username[platform].map((u) => u.username))
          }
        } else if (typeof username[platform] === 'object') {
          usernames.push(username[platform].username)
        } else {
          throw new Error400(this.options.language, 'activity.platformAndUsernameNotMatching')
        }
      } else {
        throw new Error400(this.options.language, 'activity.platformAndUsernameNotMatching')
      }
    }

    // It is important to call it with doPopulateRelations=false
    // because otherwise the performance is greatly decreased in integrations
    const existing = await MemberRepository.memberExists(
      usernames,
      platform,
      {
        ...this.options,
      },
      fillRelations,
    )

    return existing
  }

  /**
   * Perform a merge between two members.
   * - For all fields, a deep merge is performed.
   * - Then, an object is obtained with the fields that have been changed in the deep merge.
   * - The original member is updated,
   * - the other member is destroyed, and
   * - the toMerge field in tenant is updated, where each entry with the toMerge member is removed.
   * @param originalId ID of the original member. This is the member that will be updated.
   * @param toMergeId ID of the member that will be merged into the original member and deleted.
   * @returns Success/Error message
   */
  async merge(originalId, toMergeId) {
    this.options.log.info({ originalId, toMergeId }, 'Merging members!')

    let tx

    try {
      const original = await MemberRepository.findById(originalId, this.options)
      const toMerge = await MemberRepository.findById(toMergeId, this.options)

      if (original.id === toMerge.id) {
        return {
          status: 203,
          mergedId: originalId,
        }
      }

      tx = await SequelizeRepository.createTransaction(this.options)
      const repoOptions: IRepositoryOptions = { ...this.options }
      repoOptions.transaction = tx

      const allIdentities = await MemberRepository.getIdentities(
        [originalId, toMergeId],
        repoOptions,
      )
      const originalIdentities = allIdentities.get(originalId)
      const toMergeIdentities = allIdentities.get(toMergeId)
      const identitiesToMove = []
      for (const identity of toMergeIdentities) {
        if (
          !originalIdentities.find(
            (i) => i.platform === identity.platform && i.username === identity.username,
          )
        ) {
          identitiesToMove.push(identity)
        }
      }

      await MemberRepository.moveIdentitiesBetweenMembers(
        toMergeId,
        originalId,
        identitiesToMove,
        repoOptions,
      )

      // Get tags as array of ids (findById returns them as models)
      original.tags = original.tags.map((i) => i.get({ plain: true }).id)
      toMerge.tags = toMerge.tags.map((i) => i.get({ plain: true }).id)

      // leave member activities alone - we will update them with a single query later
      delete original.activities
      delete toMerge.activities

      // Performs a merge and returns the fields that were changed so we can update
      const toUpdate: any = await MemberService.membersMerge(original, toMerge)

      // we will handle activities later manually
      delete toUpdate.activities
      // we already handled identities
      delete toUpdate.username

      // Update original member
      const txService = new MemberService(repoOptions as IServiceOptions)
      await txService.update(originalId, toUpdate)

      // update activities to belong to the originalId member
      await MemberRepository.moveActivitiesBetweenMembers(toMergeId, originalId, repoOptions)

      // Remove toMerge from original member
      await MemberRepository.removeToMerge(originalId, toMergeId, repoOptions)

      const secondMemberSegments = await MemberRepository.getMemberSegments(toMergeId, repoOptions)
      await MemberRepository.includeMemberToSegments(toMergeId, {
        ...repoOptions,
        currentSegments: secondMemberSegments,
      })

      // Delete toMerge member
      await MemberRepository.destroy(toMergeId, repoOptions, true)

      await SequelizeRepository.commitTransaction(tx)
      this.options.log.info({ originalId, toMergeId }, 'Members merged!')
      return { status: 200, mergedId: originalId }
    } catch (err) {
      this.options.log.error(err, 'Error while merging members!')
      if (tx) {
        await SequelizeRepository.rollbackTransaction(tx)
      }
      throw err
    }
  }

  /**
   * Call the merge function with the special fields for members.
   * We want to always keep the earlies joinedAt date.
   * We always want the original displayName.
   * @param originalObject Original object to merge
   * @param toMergeObject Object to merge into the original object
   * @returns The updates to be performed on the original object
   */
  static membersMerge(originalObject, toMergeObject) {
    return merge(originalObject, toMergeObject, {
      joinedAt: (oldDate, newDate) => {
        // If either the new or the old date are earlier than 1970
        // it means they come from an activity without timestamp
        // and we want to keep the other one
        if (moment(oldDate).subtract(5, 'days').unix() < 0) {
          return newDate
        }
        if (moment(newDate).unix() < 0) {
          return oldDate
        }
        return moment
          .min(moment.tz(oldDate, 'Europe/London'), moment.tz(newDate, 'Europe/London'))
          .toDate()
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      displayName: (oldValue, _newValue) => oldValue,
      reach: (oldReach, newReach) => MemberService.calculateReach(oldReach, newReach),
      score: (oldScore, newScore) => Math.max(oldScore, newScore),
      emails: (oldEmails, newEmails) => {
        if (!oldEmails && !newEmails) {
          return []
        }

        oldEmails = oldEmails ?? []
        newEmails = newEmails ?? []

        const emailSet = new Set<string>(oldEmails)
        newEmails.forEach((email) => emailSet.add(email))

        return Array.from(emailSet)
      },
      username: (oldUsernames, newUsernames) => {
        // we want to keep just the usernames that are not already in the oldUsernames
        const toKeep: any = {}

        const actualOld = mapUsernameToIdentities(oldUsernames)
        const actualNew = mapUsernameToIdentities(newUsernames)

        for (const [platform, identities] of Object.entries(actualNew)) {
          const oldIdentities = actualOld[platform]

          if (oldIdentities) {
            const identitiesToKeep = []
            for (const newIdentity of identities as any[]) {
              let keep = true
              for (const oldIdentity of oldIdentities) {
                if (oldIdentity.username === newIdentity.username) {
                  keep = false
                  break
                }
              }

              if (keep) {
                identitiesToKeep.push(newIdentity)
              }
            }

            if (identitiesToKeep.length > 0) {
              toKeep[platform] = identitiesToKeep
            }
          } else {
            toKeep[platform] = identities
          }
        }

        return toKeep
      },
    })
  }

  /**
   * Given two members, add them to the toMerge fields of each other.
   * It will also update the tenant's toMerge list, removing any entry that contains
   * the pair.
   * @returns Success/Error message
   */
  async addToMerge(suggestions: IMemberMergeSuggestion[]) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    try {
      await MemberRepository.addToMerge(suggestions, { ...this.options, transaction })
      await SequelizeRepository.commitTransaction(transaction)
      return { status: 200 }
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      this.log.error(error, 'Error while adding members to merge')
      throw error
    }
  }

  /**
   * Given two members, add them to the noMerge fields of each other.
   * @param memberOneId ID of the first member
   * @param memberTwoId ID of the second member
   * @returns Success/Error message
   */
  async addToNoMerge(memberOneId, memberTwoId) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    try {
      await MemberRepository.addNoMerge(memberOneId, memberTwoId, {
        ...this.options,
        transaction,
      })
      await MemberRepository.addNoMerge(memberTwoId, memberOneId, {
        ...this.options,
        transaction,
      })
      await MemberRepository.removeToMerge(memberOneId, memberTwoId, {
        ...this.options,
        transaction,
      })
      await MemberRepository.removeToMerge(memberTwoId, memberOneId, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return { status: 200 }
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      throw error
    }
  }

  async getMergeSuggestions(
    type: IMemberMergeSuggestionsType,
    numberOfHours: Number = 1.2,
  ): Promise<IMemberMergeSuggestion[]> {
    // Adding a transaction so it will use the write database
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      let out = []
      if (type === IMemberMergeSuggestionsType.USERNAME) {
        out = await MemberRepository.mergeSuggestionsByUsername(numberOfHours, {
          ...this.options,
          transaction,
        })
      }
      if (type === IMemberMergeSuggestionsType.EMAIL) {
        out = await MemberRepository.mergeSuggestionsByEmail(numberOfHours, {
          ...this.options,
          transaction,
        })
      }
      if (type === IMemberMergeSuggestionsType.SIMILARITY) {
        out = await MemberRepository.mergeSuggestionsBySimilarity(numberOfHours, {
          ...this.options,
          transaction,
        })
      }
      await SequelizeRepository.commitTransaction(transaction)
      return out
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      this.log.error(error)
      throw error
    }
  }

  async update(id, data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      if (data.activities) {
        data.activities = await ActivityRepository.filterIdsInTenant(data.activities, {
          ...this.options,
          transaction,
        })
      }
      if (data.tags) {
        data.tags = await TagRepository.filterIdsInTenant(data.tags, {
          ...this.options,
          transaction,
        })
      }
      if (data.noMerge) {
        data.noMerge = await MemberRepository.filterIdsInTenant(
          data.noMerge.filter((i) => i !== id),
          { ...this.options, transaction },
        )
      }
      if (data.toMerge) {
        data.toMerge = await MemberRepository.filterIdsInTenant(
          data.toMerge.filter((i) => i !== id),
          { ...this.options, transaction },
        )
      }
      if (data.username) {
        // need to filter out existing identities from the payload
        const existingIdentities = (
          await MemberRepository.getIdentities([id], {
            ...this.options,
            transaction,
          })
        ).get(id)

        data.username = mapUsernameToIdentities(data.username, data.platform)

        for (const identity of existingIdentities) {
          if (identity.platform in data.username) {
            // new username has this platform - we need to check if it also has the username
            let found = false
            for (const newIdentity of data.username[identity.platform]) {
              if (newIdentity.username === identity.username) {
                found = true
                break
              }
            }

            if (found) {
              // remove from data.username
              data.username[identity.platform] = data.username[identity.platform].filter(
                (i) => i.username !== identity.username,
              )
            } else {
              data.username[identity.platform].push({ ...identity, delete: true })
            }
          } else {
            // new username doesn't have this platform - we can delete the existing identity
            data.username[identity.platform] = { ...identity, delete: true }
          }
        }
      }

      const record = await MemberRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      if (error.name && error.name.includes('Sequelize')) {
        this.log.error(
          error,
          {
            query: error.sql,
            errorMessage: error.original.message,
          },
          'Error during member update!',
        )
      } else {
        this.log.error(error, 'Error during member update!')
      }
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'member')

      throw error
    }
  }

  async destroyBulk(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      await MemberRepository.destroyBulk(
        ids,
        {
          ...this.options,
          transaction,
        },
        true,
      )

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async destroyAll(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      for (const id of ids) {
        await MemberRepository.destroy(
          id,
          {
            ...this.options,
            transaction,
          },
          true,
        )
      }

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async findById(id, returnPlain = true, doPopulateRelations = true) {
    return MemberRepository.findById(id, this.options, returnPlain, doPopulateRelations)
  }

  async findAllAutocomplete(search, limit) {
    return MemberRepository.findAllAutocomplete(search, limit, this.options)
  }

  async findAndCountActive(
    filters: IActiveMemberFilter,
    offset: number,
    limit: number,
    orderBy: string,
  ) {
    return MemberRepository.findAndCountActive(filters, limit, offset, orderBy, this.options)
  }

  async findAndCountAll(args) {
    const memberAttributeSettings = (
      await MemberAttributeSettingsRepository.findAndCountAll({}, this.options)
    ).rows
    return MemberRepository.findAndCountAll(
      { ...args, attributesSettings: memberAttributeSettings },
      this.options,
    )
  }

  async queryV2(data) {
    const memberAttributeSettings = (
      await MemberAttributeSettingsRepository.findAndCountAll({}, this.options)
    ).rows

    return MemberRepository.findAndCountAllv2(
      {
        limit: data.limit,
        offset: data.offset,
        filter: data.filter,
        orderBy: data.orderBy || undefined,
        countOnly: data.countOnly || false,
        attributesSettings: memberAttributeSettings,
      },
      this.options,
    )
  }

  async query(data, exportMode = false) {
    const memberAttributeSettings = (
      await MemberAttributeSettingsRepository.findAndCountAll({}, this.options)
    ).rows.filter((setting) => setting.type !== AttributeType.SPECIAL)
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    return MemberRepository.findAndCountAll(
      {
        advancedFilter,
        orderBy,
        limit,
        offset,
        attributesSettings: memberAttributeSettings,
        exportMode,
      },
      this.options,
    )
  }

  async queryForCsv(data) {
    data.limit = 10000000000000
    const found = await this.query(data, true)

    const relations = [
      { relation: 'organizations', attributes: ['name'] },
      { relation: 'notes', attributes: ['body'] },
      { relation: 'tags', attributes: ['name'] },
    ]
    for (const relation of relations) {
      for (const member of found.rows) {
        member[relation.relation] = member[relation.relation]?.map((i) => ({
          id: i.id,
          ...lodash.pick(i, relation.attributes),
        }))
      }
    }

    return found
  }

  async export(data) {
    const result = await sendExportCSVNodeSQSMessage(
      this.options.currentTenant.id,
      this.options.currentUser.id,
      ExportableEntity.MEMBERS,
      data,
    )
    return result
  }

  async findMembersWithMergeSuggestions(args) {
    return MemberRepository.findMembersWithMergeSuggestions(args, this.options)
  }

  async import(data, importHash) {
    if (!importHash) {
      throw new Error400(this.options.language, 'importer.errors.importHashRequired')
    }

    if (await this._isImportHashExistent(importHash)) {
      throw new Error400(this.options.language, 'importer.errors.importHashExistent')
    }

    const dataToCreate = {
      ...data,
      importHash,
    }

    return this.upsert(dataToCreate)
  }

  async _isImportHashExistent(importHash) {
    const count = await MemberRepository.count(
      {
        importHash,
      },
      this.options,
    )

    return count > 0
  }

  /**
   *
   * @param oldReach The old reach object
   * @param newReach the new reach object
   * @returns The new reach object
   */
  static calculateReach(oldReach: any, newReach: any) {
    // Totals are recomputed, so we delete them first
    delete oldReach.total
    delete newReach.total
    const out = lodash.merge(oldReach, newReach)
    if (Object.keys(out).length === 0) {
      return { total: -1 }
    }
    // Total is the sum of all attributes
    out.total = lodash.sum(Object.values(out))
    return out
  }
}
