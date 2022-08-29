import { Transaction } from 'sequelize/types'
import Error400 from '../errors/Error400'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { IServiceOptions } from './IServiceOptions'
import merge from './helpers/merge'
import ActivityRepository from '../database/repositories/activityRepository'
import CommunityMemberRepository from '../database/repositories/communityMemberRepository'
import CommunityMemberService from './communityMemberService'
import ConversationService from './conversationService'
import telemetryTrack from '../segment/telemetryTrack'
import ConversationSettingsService from './conversationSettingsService'
import { getConfig } from '../config'

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
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      if (data.communityMember) {
        data.communityMember = await CommunityMemberRepository.filterIdInTenant(
          data.communityMember,
          { ...this.options, transaction },
        )
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
        const toUpdate = merge(existing, data)
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

        // Only track activity's platform and timestamp and communityMemberId. It is completely annonymous.
        telemetryTrack(
          'Activity created',
          {
            id: record.id,
            platform: record.platform,
            timestamp: record.timestamp,
            communityMemberId: record.communityMemberId,
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

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'activity')

      throw error
    }
  }

  /**
   * Get the sentiment of an activity from its body and title.
   * It will cut the combination of body and title to a maximum of 90 words or 1400 characters.
   * @param data Activity data. Includes body and title.
   * @returns The sentiment of the combination of body and title. Between -1 and 1.
   */
  static async getSentiment(data) {
    if (getConfig().NODE_ENV === 'test') {
      return {
        positive: 0.42,
        negative: 0.42,
        neutral: 0.42,
        mixed: 0.42,
        sentiment: 'positive',
      }
    }

    // Concatenate title and body
    const text = `${data.title} ${data.body}`.trim()

    if (getConfig().RAPID_API_KEY !== undefined) {
      const axios = require('axios')

      const encodedParams = new URLSearchParams()
      encodedParams.append('text', text)

      const options = {
        method: 'POST',
        url: 'https://twinword-sentiment-analysis.p.rapidapi.com/analyze/',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'X-RapidAPI-Key': getConfig().RAPID_API_KEY,
          'X-RapidAPI-Host': 'twinword-sentiment-analysis.p.rapidapi.com',
        },
        data: encodedParams,
      }

      return axios
        .request(options)
        .then((response) => response.data.score)
        .catch((error) => {
          throw error
        })
    }
    return null
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
      const conversationTitle = await conversationService.generateTitle(parent.title || parent.body)
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
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      const activityExists = await this._activityExists(data, transaction)

      const existingMember = activityExists
        ? await new CommunityMemberService(this.options).findById(
            activityExists.communityMemberId,
            true,
            false,
          )
        : false

      const member = await new CommunityMemberService(this.options).upsert(
        {
          ...data.communityMember,
          platform: data.platform,
          joinedAt: data.timestamp,
        },
        true,
        existingMember,
      )

      data.communityMember = member.id

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
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      data.communityMember = await CommunityMemberRepository.filterIdInTenant(
        data.communityMember,
        { ...this.options, transaction },
      )

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
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

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
}
