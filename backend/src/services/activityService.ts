import { Transaction } from 'sequelize/types'
import { Blob } from 'buffer'
import { PlatformType } from '../types/integrationEnums'
import Error400 from '../errors/Error400'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { detectSentiment, detectSentimentBatch } from './aws'
import { IServiceOptions } from './IServiceOptions'
import merge from './helpers/merge'
import ActivityRepository from '../database/repositories/activityRepository'
import MemberRepository from '../database/repositories/memberRepository'
import MemberService from './memberService'
import ConversationService from './conversationService'
import telemetryTrack from '../segment/telemetryTrack'
import ConversationSettingsService from './conversationSettingsService'
import { IS_TEST_ENV, IS_DEV_ENV } from '../config'
import { sendNewActivityNodeSQSMessage } from '../serverless/microservices/nodejs/nodeMicroserviceSQS'

export default class ActivityService {
  options: IServiceOptions

  constructor(options) {
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
  async upsert(data, existing: boolean | any = false) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      if (data.member) {
        data.member = await MemberRepository.filterIdInTenant(data.member, {
          ...this.options,
          transaction,
        })
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
          const sentiment = await ActivityService.getSentiment(data)
          data.sentiment = sentiment
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

      if (!existing) {
        try {
          await sendNewActivityNodeSQSMessage(this.options.currentTenant.id, record)
        } catch (err) {
          console.log(`Error triggering new activity automation - ${record.id}!`, err)
        }
      }

      return record
    } catch (error) {
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
  static async getSentiment(data) {
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

    data.body = data.body ?? ''
    data.title = data.title ?? ''

    const ALLOWED_MAX_BYTE_LENGTH = 4500

    // Concatenate title and body
    let text = `${data.title} ${data.body}`.trim()

    // Check text byte size
    let blob = new Blob([text])
    if (blob.size > ALLOWED_MAX_BYTE_LENGTH) {
      blob = blob.slice(0, ALLOWED_MAX_BYTE_LENGTH)
      text = await blob.text()
    }

    return text === '' ? {} : detectSentiment(text)
  }

  /**
   * Get the sentiment of an array of activities form its' body and title
   * Only first 5000 bytes of text are passed through because of AWS Comprehend restrictions.
   * @param activityArray activity array
   * @returns list of sentiments ordered same as input array
   */
  static async getSentimentBatch(activityArray) {
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

    console.time('sentiment-api-request')
    const values = await Promise.all(promiseArray)
    console.timeEnd('sentiment-api-request')

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
    const conversationService = new ConversationService({ ...this.options, transaction })

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

    if (conversation.published) {
      await conversationService.loadIntoSearchEngine(record.conversationId, transaction)
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

  async createWithMember(data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const activityExists = await this._activityExists(data, transaction)

      const existingMember = activityExists
        ? await new MemberService(this.options).findById(activityExists.memberId, true, false)
        : false

      const member = await new MemberService(this.options).upsert(
        {
          ...data.member,
          platform: data.platform,
          joinedAt: data.timestamp,
        },
        existingMember,
      )

      data.member = member.id

      const record = await this.upsert(data, activityExists)

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'activity')

      throw error
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
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    return ActivityRepository.findAndCountAll(
      { advancedFilter, orderBy, limit, offset },
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
