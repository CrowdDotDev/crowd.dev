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
import { sendNewMemberNodeSQSMessage } from '../serverless/microservices/nodejs/nodeMicroserviceSQS'
import MemberAttributeSettingsRepository from '../database/repositories/memberAttributeSettingsRepository'
import MemberAttributeSettingsService from './memberAttributeSettingsService'
import SettingsService from './settingsService'
import OrganizationService from './organizationService'

export default class MemberService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  /**
   * Transforms the attributes coming from a request to a structured, attribute-name-key(ed) object.
   * Example incoming attributes:
   * {
   *   attributes:{
   *     github:{
   *         url: 'http://some-github-url'
   *         name: 'Michael Scott'
   *         isHireable: true
   *     },
   *     twitter:{
   *         url: 'http://some-twitter-url'
   *     }
   *   }
   * }
   *
   * This object is transformed into:
   * {
   *   attributes:{
   *     url: {
   *        github: 'http://some-github-url',
   *        twitter: 'http://some-twitter-url'
   *     },
   *     name: {
   *        github: 'Michael Scott'
   *     },
   *     isHireable: {
   *        github: true
   *     }
   *   }
   * }
   *
   * Throws 400 Errors if the attribute does not exist in settings,
   * or if the sent attribute type does not match the type in the settings.
   * @param attributes
   * @returns structured object
   */
  async getStructuredAttributes(attributes: object): Promise<object> {
    const attributesObject = {}

    // check attribute exists in memberAttributeSettings
    const memberAttributeSettings = (
      await MemberAttributeSettingsRepository.findAndCountAll({}, this.options)
    ).rows.reduce((acc, attribute) => {
      acc[attribute.name] = attribute
      return acc
    }, {})

    for (const platform of Object.keys(attributes)) {
      for (const attributeName of Object.keys(attributes[platform])) {
        if (!memberAttributeSettings[attributeName]) {
          throw new Error400(
            this.options.language,
            'settings.memberAttributes.notFound',
            attributeName,
          )
        }
        if (
          !MemberAttributeSettingsService.isCorrectType(
            attributes[platform][attributeName],
            memberAttributeSettings[attributeName].type,
          )
        ) {
          throw new Error400(
            this.options.language,
            'settings.memberAttributes.wrongType',
            attributeName,
            memberAttributeSettings[attributeName].type,
          )
        }

        if (attributesObject[attributeName]) {
          attributesObject[attributeName] = {
            ...attributesObject[attributeName],
            [platform]: attributes[platform][attributeName],
          }
        } else {
          attributesObject[attributeName] = {
            [platform]: attributes[platform][attributeName],
          }
        }
      }
    }

    return attributesObject
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
      const highestPriorityPlatform = this.getHighestPriorityPlatformForAttributes(
        Object.keys(attributes[attributeName]),
        priorityArray,
      )
      attributes[attributeName].default = attributes[attributeName][highestPriorityPlatform]
    }

    return attributes
  }

  /**
   * Returns the highest priority platform from an array of platforms
   * If any of the platforms does not exist in the priority array, returns
   * the first platform sent as the highest priority platform.
   * @param platforms Array of platforms to select the highest priority platform
   * @param priorityArray zero indexed priority array. Lower index means higher priority
   * @returns the highest priority platform
   */
  getHighestPriorityPlatformForAttributes(platforms: string[], priorityArray: string[]): string {
    if (platforms.length <= 0) {
      throw new Error400(this.options.language, 'settings.memberAttributes.noPlatformSent')
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
    if (!('platform' in data)) {
      throw new Error400(this.options.language, 'activity.platformRequiredWhileUpsert')
    }

    if (!data.displayName) {
      if (typeof data.username === 'string') {
        data.displayName = data.username
      } else {
        data.displayName = data.username[data.platform]
      }
    }

    const transaction = await SequelizeRepository.createTransaction(this.options.database)

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
        data.attributes = await this.getStructuredAttributes(data.attributes)
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

      existing = existing || (await this.memberExists(data.username, platform))
      if (typeof data.username === 'string') {
        data.username = { [platform]: data.username }
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
          },
          this.options,
        )
      }

      await SequelizeRepository.commitTransaction(transaction)

      if (!existing) {
        sendNewMemberNodeSQSMessage(this.options.currentTenant.id, record.id)
          .then(() => console.log(`New member automation triggered - ${record.id}!`))
          .catch((err) =>
            console.log(`Error triggering new member automation - ${record.id}!`, err),
          )
      }

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'member')

      throw error
    }
  }

  /**
   * Checks if given user already exists by username and platform.
   * Username can be given as a plain string or as dictionary with
   * related platforms.
   * Ie:
   * username = 'anil' || username = { github: 'anil' } || username = { github: 'anil', twitter: 'some-other-username' }
   * @param username username of the member
   * @param platform platform of the member
   * @returns null | found member
   */
  async memberExists(username: object | string, platform: string) {
    let existing = null
    const fillRelations = false

    if (typeof username === 'string') {
      // It is important to call it with doPopulateRelations=false
      // because otherwise the performance is greatly decreased in integrations
      existing = await MemberRepository.memberExists(
        username,
        platform,
        {
          ...this.options,
        },
        fillRelations,
      )
    } else if (typeof username === 'object') {
      if (platform in username) {
        // It is important to call it with doPopulateRelations=false
        // because otherwise the performance is greatly decreased in integrations
        existing = await MemberRepository.memberExists(
          username[platform],
          platform,
          {
            ...this.options,
          },
          fillRelations,
        )
      } else {
        throw new Error400(this.options.language, 'activity.platformAndUsernameNotMatching')
      }
    }

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
    const original = await MemberRepository.findById(originalId, this.options)
    const toMerge = await MemberRepository.findById(toMergeId, this.options)

    if (original.id === toMerge.id) {
      return {
        status: 203,
        mergedId: originalId,
      }
    }

    // Get tags and activities as array of ids (findById returns them as models)
    original.tags = original.tags.map((i) => i.get({ plain: true }).id)
    original.activities = original.activities.map((i) => i.get({ plain: true }))

    toMerge.tags = toMerge.tags.map((i) => i.get({ plain: true }).id)
    toMerge.activities = toMerge.activities.map((i) => i.get({ plain: true }))

    // Performs a merge and returns the fields that were changed so we can update
    const toUpdate = MemberService.membersMerge(original, toMerge)
    if (toUpdate.activities) {
      toUpdate.activities = toUpdate.activities.map((a) => a.id)
    }
    // Update original member
    await this.update(originalId, toUpdate)

    // Remove toMerge from original member
    await MemberRepository.removeToMerge(originalId, toMergeId, this.options)

    // Delete toMerge member
    await MemberRepository.destroy(toMergeId, this.options, true)

    return { status: 200, mergedId: originalId }
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

      // Get rid of activities that are the same and were in both members
      activities: (oldActivities, newActivities) => {
        oldActivities = oldActivities || []
        newActivities = newActivities || []
        // A member cannot 2 different activities with same timestamp and platform and type
        const uniq = lodash.uniqWith(
          [...oldActivities, ...newActivities],
          (act1, act2) =>
            moment(act1.timestamp).utc().unix() === moment(act2.timestamp).utc().unix() &&
            act1.platform === act2.platform,
        )
        return uniq.length > 0 ? uniq : null
      },
    })
  }

  /**
   * Given two members, add them to the toMerge fields of each other.
   * It will also update the tenant's toMerge list, removing any entry that contains
   * the pair.
   * @param memberOneId ID of the first member
   * @param memberTwoId ID of the second member
   * @returns Success/Error message
   */
  async addToMerge(memberOneId, memberTwoId) {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      await MemberRepository.addToMerge(memberOneId, memberTwoId, {
        ...this.options,
        transaction,
      })
      await MemberRepository.addToMerge(memberTwoId, memberOneId, {
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

  /**
   * Given two members, add them to the noMerge fields of each other.
   * @param memberOneId ID of the first member
   * @param memberTwoId ID of the second member
   * @returns Success/Error message
   */
  async addToNoMerge(memberOneId, memberTwoId) {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

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

  async update(id, data) {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

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

      const record = await MemberRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'member')

      throw error
    }
  }

  async destroyBulk(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

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
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

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

  async findAndCountAll(args) {
    const memberAttributeSettings = (
      await MemberAttributeSettingsRepository.findAndCountAll({}, this.options)
    ).rows
    return MemberRepository.findAndCountAll(
      { ...args, attributesSettings: memberAttributeSettings },
      this.options,
    )
  }

  async query(data) {
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    return MemberRepository.findAndCountAll(
      { advancedFilter, orderBy, limit, offset },
      this.options,
    )
  }

  async findMembersWithMergeSuggestions() {
    return MemberRepository.findMembersWithMergeSuggestions(this.options)
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
