import { LoggerBase, logExecutionTime } from '@crowd/logging'
import { Blob } from 'buffer'
import { Transaction } from 'sequelize/types'
import { PlatformType } from '@crowd/types'
import { IS_DEV_ENV, IS_TEST_ENV } from '../conf'
import ActivityRepository from '../database/repositories/activityRepository'
import MemberAttributeSettingsRepository from '../database/repositories/memberAttributeSettingsRepository'
import MemberRepository from '../database/repositories/memberRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { mapUsernameToIdentities } from '../database/repositories/types/memberTypes'
import Error400 from '../errors/Error400'
import telemetryTrack from '../segment/telemetryTrack'
import { sendNewActivityNodeSQSMessage } from '../serverless/utils/nodeWorkerSQS'
import { IServiceOptions } from './IServiceOptions'
import { detectSentiment, detectSentimentBatch } from './aws'
import ConversationService from './conversationService'
import ConversationSettingsService from './conversationSettingsService'
import merge from './helpers/merge'
import MemberService from './memberService'
import SegmentRepository from '../database/repositories/segmentRepository'
import SegmentService from './segmentService'

export default class ActivityService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  /**
   * Upsert an activity. If the member exists, it updates it. If it does not exist, it creates it.
   * The update is done with a deep merge of the original and the new activities.
   * @param data Activity data
   * data.sourceId is the platform specific id given by the platform.
   * data.sourceParentId is the platform specific parentId given by the platform
   * We save both ids to create relationships with other activities.
   * When a sourceParentId is present in upsert, all sourceIds are searched to find the activity entity where sourceId = sourceParentId
   * Found activity's(parent) id(uuid) is written to the new activities parentId.
   * If data.sourceParentId is not present, we try finding children activities of current activity
   * where sourceParentId = data.sourceId. Found activity's parentId and conversations gets updated accordingly
   * @param existing If the activity already exists, the activity. If it doesn't or we don't know, false
   * @returns The upserted activity
   */
  async upsert(data, existing: boolean | any = false, fireCrowdWebhooks: boolean = true) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      if (data.member) {
        data.member = await MemberRepository.filterIdInTenant(data.member, {
          ...this.options,
          transaction,
        })
      }

      // check type exists, if doesn't exist, create a placeholder type with activity type key
      if (
        data.platform &&
        data.type &&
        !SegmentRepository.activityTypeExists(data.platform, data.type, this.options)
      ) {
        await new SegmentService(this.options).createActivityType(
          { type: data.type },
          data.platform,
        )
      }

      // check if channel exists in settings for respective platform. If not, update by adding channel to settings
      if (data.platform && data.channel) {
        await new SegmentService(this.options).updateActivityChannels(data)
      }

      // If a sourceParentId is sent, try to find it in our db
      if ('sourceParentId' in data && data.sourceParentId) {
        const parent = await ActivityRepository.findOne(
          { sourceId: data.sourceParentId },
          { ...this.options, transaction },
        )
        if (parent) {
          data.parent = await ActivityRepository.filterIdInTenant(parent.id, {
            ...this.options,
            transaction,
          })
        } else {
          data.parent = null
        }
      }

      if (!existing) {
        existing = await this._activityExists(data, transaction)
      }

      let record
      if (existing) {
        const { id } = existing
        delete existing.id
        const toUpdate = merge(existing, data, {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          timestamp: (oldValue, _newValue) => oldValue,
        })
        record = await ActivityRepository.update(id, toUpdate, {
          ...this.options,
          transaction,
        })
      } else {
        if (!data.sentiment) {
          const sentiment = await this.getSentiment(data)
          data.sentiment = sentiment
        }

        if (!data.username && data.platform === PlatformType.OTHER) {
          const { displayName } = await MemberRepository.findById(data.member, {
            ...this.options,
            transaction,
          })
          // Get the first key of the username object as a string
          data.username = displayName
        }

        record = await ActivityRepository.create(data, {
          ...this.options,
          transaction,
        })

        // Only track activity's platform and timestamp and memberId. It is completely annonymous.
        telemetryTrack(
          'Activity created',
          {
            id: record.id,
            platform: record.platform,
            timestamp: record.timestamp,
            memberId: record.memberId,
            createdAt: record.createdAt,
          },
          this.options,
        )

        // newly created activity can be a parent or a child (depending on the insert order)
        // if child
        if (data.parent) {
          record = await this.addToConversation(record.id, data.parent, transaction)
        } else if ('sourceId' in data && data.sourceId) {
          // if it's not a child, it may be a parent of previously added activities
          const children = await ActivityRepository.findAndCountAll(
            { filter: { sourceParentId: data.sourceId } },
            { ...this.options, transaction },
          )

          for (const child of children.rows) {
            // update children with newly created parentId
            await ActivityRepository.update(
              child.id,
              { parent: record.id },
              { ...this.options, transaction },
            )

            // manage conversations for each child
            await this.addToConversation(child.id, record.id, transaction)
          }
        }
      }

      await SequelizeRepository.commitTransaction(transaction)

      if (!existing && fireCrowdWebhooks) {
        try {
          await sendNewActivityNodeSQSMessage(this.options.currentTenant.id, record.id)
        } catch (err) {
          this.log.error(
            err,
            { activityId: record.id },
            'Error triggering new activity automation!',
          )
        }
      }

      if (!fireCrowdWebhooks) {
        this.log.info('Ignoring outgoing webhooks because of fireCrowdWebhooks!')
      }

      return record
    } catch (error) {
      if (error.name && error.name.includes('Sequelize')) {
        this.log.error(
          error,
          {
            query: error.sql,
            errorMessage: error.original.message,
          },
          'Error during activity upsert!',
        )
      } else {
        this.log.error(error, 'Error during activity upsert!')
      }

      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'activity')

      throw error
    }
  }

  /**
   * Get the sentiment of an activity from its body and title.
   * Only first 5000 bytes of text are passed through because of AWS Comprehend restrictions.
   * @param data Activity data. Includes body and title.
   * @returns The sentiment of the combination of body and title. Between -1 and 1.
   */
  async getSentiment(data) {
    if (IS_TEST_ENV) {
      return {
        positive: 0.42,
        negative: 0.42,
        neutral: 0.42,
        mixed: 0.42,
        label: 'positive',
        sentiment: 0.42,
      }
    }
    if (IS_DEV_ENV) {
      if (data.body === '' || data.body === undefined) {
        return {}
      }
      // Return a random number between 0 and 100
      const score = Math.floor(Math.random() * 100)
      let label = 'neutral'
      if (score < 33) {
        label = 'negative'
      } else if (score > 66) {
        label = 'positive'
      }
      return {
        positive: Math.floor(Math.random() * 100),
        negative: Math.floor(Math.random() * 100),
        neutral: Math.floor(Math.random() * 100),
        mixed: Math.floor(Math.random() * 100),
        sentiment: score,
        label,
      }
    }

    try {
      data.body = data.body ?? ''
      data.title = data.title ?? ''

      // Concatenate title and body
      const text = `${data.title} ${data.body}`.trim()

      return text === '' ? {} : await detectSentiment(text)
    } catch (err) {
      this.log.error(
        { err, data },
        'Error getting sentiment of activity - Setting sentiment to empty object.',
      )
      return {}
    }
  }

  /**
   * Get the sentiment of an array of activities form its' body and title
   * Only first 5000 bytes of text are passed through because of AWS Comprehend restrictions.
   * @param activityArray activity array
   * @returns list of sentiments ordered same as input array
   */
  async getSentimentBatch(activityArray) {
    const ALLOWED_MAX_BYTE_LENGTH = 4500
    let textArray = await Promise.all(
      activityArray.map(async (i) => {
        let text = `${i.title} ${i.body}`.trim()
        let blob = new Blob([text])
        if (blob.size > ALLOWED_MAX_BYTE_LENGTH) {
          blob = blob.slice(0, ALLOWED_MAX_BYTE_LENGTH)
          text = await blob.text()
        }
        return text
      }),
    )

    const MAX_BATCH_SIZE = 25

    const promiseArray = []

    if (textArray.length > MAX_BATCH_SIZE) {
      while (textArray.length > MAX_BATCH_SIZE) {
        promiseArray.push(detectSentimentBatch(textArray.slice(0, MAX_BATCH_SIZE)))
        textArray = textArray.slice(MAX_BATCH_SIZE)
      }
      // insert last small chunk
      if (textArray.length > 0) promiseArray.push(detectSentimentBatch(textArray))
    } else {
      promiseArray.push(textArray)
    }

    const values = await logExecutionTime(
      () => Promise.all(promiseArray),
      this.log,
      'sentiment-api-request',
    )

    return values.reduce((acc, i) => {
      acc.push(...i)
      return acc
    }, [])
  }

  /**
   * Adds an activity to a conversation.
   * If parent already has a conversation, adds child to parent's conversation
   * If parent doesn't have a conversation, and child has one,
   * adds parent to child's conversation.
   * If both of them doesn't have a conversation yet, creates one and adds both to the conversation.
   * @param {string} id id of the activity
   * @param parentId id of the parent activity
   * @param {Transaction} transaction
   * @returns updated activity plain object
   */

  async addToConversation(id: string, parentId: string, transaction: Transaction) {
    const parent = await ActivityRepository.findById(parentId, { ...this.options, transaction })
    const child = await ActivityRepository.findById(id, { ...this.options, transaction })
    const conversationService = new ConversationService({
      ...this.options,
      transaction,
    } as IServiceOptions)

    let record
    let conversation

    // check if parent is in a conversation already
    if (parent.conversationId) {
      conversation = await conversationService.findById(parent.conversationId)
      record = await ActivityRepository.update(
        id,
        { conversationId: parent.conversationId },
        { ...this.options, transaction },
      )
    } else if (child.conversationId) {
      // if child is already in a conversation
      conversation = await conversationService.findById(child.conversationId)

      record = child

      // if conversation is not already published, update conversation info with new parent
      if (!conversation.published) {
        const newConversationTitle = await conversationService.generateTitle(
          parent.title || parent.body,
          ActivityService.hasHtmlActivities(parent.platform),
        )

        conversation = await conversationService.update(conversation.id, {
          title: newConversationTitle,
          slug: await conversationService.generateSlug(newConversationTitle),
        })
      }

      // add parent to the conversation
      await ActivityRepository.update(
        parent.id,

        { conversationId: conversation.id },
        { ...this.options, transaction },
      )
    } else {
      // neither child nor parent is in a conversation, create one from parent
      const conversationTitle = await conversationService.generateTitle(
        parent.title || parent.body,
        ActivityService.hasHtmlActivities(parent.platform),
      )
      const conversationSettings = await ConversationSettingsService.findOrCreateDefault(
        this.options,
      )
      const channel = ConversationService.getChannelFromActivity(parent)

      const published = ConversationService.shouldAutoPublishConversation(
        conversationSettings,
        parent.platform,
        channel,
      )

      conversation = await conversationService.create({
        title: conversationTitle,
        published,
        slug: await conversationService.generateSlug(conversationTitle),
        platform: parent.platform,
      })
      await ActivityRepository.update(
        parentId,
        { conversationId: conversation.id },
        { ...this.options, transaction },
      )
      record = await ActivityRepository.update(
        id,
        { conversationId: conversation.id },
        { ...this.options, transaction },
      )
    }

    return record
  }

  /**
   * Check if an activity exists. An activity is considered unique by sourceId & tenantId
   * @param data Data to be added to the database
   * @param transaction DB transaction
   * @returns The existing activity if it exists, false otherwise
   */
  async _activityExists(data, transaction) {
    // An activity is unique by it's sourceId and tenantId
    const exists = await ActivityRepository.findOne(
      {
        sourceId: data.sourceId,
      },
      {
        ...this.options,
        transaction,
      },
    )
    return exists || false
  }

  async createWithMember(data, fireCrowdWebhooks: boolean = true) {
    const logger = this.options.log

    const errorDetails: any = {}

    const transaction = await SequelizeRepository.createTransaction(this.options)
    const memberService = new MemberService(this.options)

    try {
      data.member.username = mapUsernameToIdentities(data.member.username, data.platform)

      const platforms = Object.keys(data.member.username)
      if (platforms.length === 0) {
        throw new Error('Member must have at least one platform username set!')
      }

      if (!data.username) {
        data.username = data.member.username[data.platform][0].username
      }

      logger.trace(
        { type: data.type, platform: data.platform, username: data.username },
        'Creating activity with member!',
      )

      let activityExists = await this._activityExists(data, transaction)

      let existingMember = activityExists
        ? await memberService.findById(activityExists.memberId, true, false)
        : false

      if (existingMember) {
        // let's look just in case for an existing member and if they are different we should log them because they will probably fail to insert
        const tempExisting = await memberService.memberExists(data.member.username, data.platform)

        if (!tempExisting) {
          logger.warn(
            {
              existingMemberId: existingMember.id,
              username: data.username,
              platform: data.platform,
              activityType: data.type,
            },
            'We have found an existing member but actually we could not find him by username and platform!',
          )
          errorDetails.reason = 'activity_service_createWithMember_existing_member_not_found'
          errorDetails.details = {
            existingMemberId: existingMember.id,
            existingActivityId: activityExists.id,
            username: data.username,
            platform: data.platform,
            activityType: data.type,
          }
        } else if (existingMember.id !== tempExisting.id) {
          logger.warn(
            {
              existingMemberId: existingMember.id,
              actualExistingMemberId: tempExisting.id,
              existingActivityId: activityExists.id,
              username: data.username,
              platform: data.platform,
              activityType: data.type,
            },
            'We found a member with the same username and platform but different id! Deleting the activity and continuing as if the activity did not exist.',
          )

          await ActivityRepository.destroy(activityExists.id, this.options, true)
          activityExists = false
          existingMember = false
        }
      }

      const member = await memberService.upsert(
        {
          ...data.member,
          platform: data.platform,
          joinedAt: activityExists ? activityExists.timestamp : data.timestamp,
        },
        existingMember,
        fireCrowdWebhooks,
      )

      if (data.objectMember) {
        if (typeof data.objectMember.username === 'string') {
          data.objectMember.username = {
            [data.platform]: {
              username: data.objectMember.username,
            },
          }
        }

        const objectMemberPlatforms = Object.keys(data.objectMember.username)

        if (objectMemberPlatforms.length === 0) {
          throw new Error('Object member must have at least one platform username set!')
        }

        for (const platform of objectMemberPlatforms) {
          if (typeof data.objectMember.username[platform] === 'string') {
            data.objectMember.username[platform] = {
              username: data.objectMember.username[platform],
            }
          }
        }

        const objectMember = await memberService.upsert(
          {
            ...data.objectMember,
            platform: data.platform,
            joinedAt: data.timestamp,
          },
          false,
          fireCrowdWebhooks,
        )

        if (!data.objectMemberUsername) {
          data.objectMemberUsername = data.objectMember.username[data.platform].username
        }

        data.objectMember = objectMember.id
      }

      data.member = member.id

      const record = await this.upsert(data, activityExists, fireCrowdWebhooks)

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      const reason = errorDetails.reason || undefined
      const details = errorDetails.details || undefined

      if (error.name && error.name.includes('Sequelize') && error.original) {
        this.log.error(
          error,
          {
            query: error.sql,
            errorMessage: error.original.message,
            reason,
            details,
          },
          'Error during activity create with member!',
        )
      } else {
        this.log.error(error, { reason, details }, 'Error during activity create with member!')
      }
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'activity')

      throw { ...error, reason, details }
    }
  }

  async update(id, data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      data.member = await MemberRepository.filterIdInTenant(data.member, {
        ...this.options,
        transaction,
      })

      if (data.parent) {
        data.parent = await ActivityRepository.filterIdInTenant(data.parent, {
          ...this.options,
          transaction,
        })
      }

      const record = await ActivityRepository.update(id, data, {
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
          'Error during activity update!',
        )
      } else {
        this.log.error(error, 'Error during activity update!')
      }
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'activity')

      throw error
    }
  }

  async destroyAll(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      for (const id of ids) {
        await ActivityRepository.destroy(id, {
          ...this.options,
          transaction,
        })
      }

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async findById(id) {
    return ActivityRepository.findById(id, this.options)
  }

  async findAllAutocomplete(search, limit) {
    return ActivityRepository.findAllAutocomplete(search, limit, this.options)
  }

  async findAndCountAll(args) {
    return ActivityRepository.findAndCountAll(args, this.options)
  }

  async query(data) {
    const memberAttributeSettings = (
      await MemberAttributeSettingsRepository.findAndCountAll({}, this.options)
    ).rows
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    return ActivityRepository.findAndCountAll(
      { advancedFilter, orderBy, limit, offset, attributesSettings: memberAttributeSettings },
      this.options,
    )
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
    const count = await ActivityRepository.count(
      {
        importHash,
      },
      this.options,
    )

    return count > 0
  }

  static hasHtmlActivities(platform: PlatformType): boolean {
    switch (platform) {
      case PlatformType.DEVTO:
        return true
      default:
        return false
    }
  }
}
