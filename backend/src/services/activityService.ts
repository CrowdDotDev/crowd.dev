import { Blob } from 'buffer'
import vader from 'crowd-sentiment'
import { Transaction } from 'sequelize/types'

import { Error400, distinct, singleOrDefault } from '@crowd/common'
import {
  DEFAULT_COLUMNS_TO_SELECT,
  addActivityToConversation,
  deleteActivities,
  insertActivities,
  queryActivities,
  updateActivity,
} from '@crowd/data-access-layer'
import {
  MemberField,
  findMemberById,
  queryMembersAdvanced,
} from '@crowd/data-access-layer/src/members'
import { optionsQx } from '@crowd/data-access-layer/src/queryExecutor'
import { ActivityDisplayService } from '@crowd/integrations'
import { LoggerBase, logExecutionTime } from '@crowd/logging'
import { IMemberIdentity, IntegrationResultType, PlatformType, SegmentData } from '@crowd/types'

import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import OrganizationRepository from '@/database/repositories/organizationRepository'
import { getDataSinkWorkerEmitter } from '@/serverless/utils/queueService'

import { GITHUB_CONFIG, IS_DEV_ENV, IS_TEST_ENV } from '../conf'
import ActivityRepository from '../database/repositories/activityRepository'
import MemberRepository from '../database/repositories/memberRepository'
import SegmentRepository from '../database/repositories/segmentRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import {
  UsernameIdentities,
  mapUsernameToIdentities,
} from '../database/repositories/types/memberTypes'
import telemetryTrack from '../segment/telemetryTrack'

import { IServiceOptions } from './IServiceOptions'
import { detectSentiment, detectSentimentBatch } from './aws'
import ConversationService from './conversationService'
import merge from './helpers/merge'
import MemberAffiliationService from './memberAffiliationService'
import SearchSyncService from './searchSyncService'
import SegmentService from './segmentService'

const IS_GITHUB_COMMIT_DATA_ENABLED = GITHUB_CONFIG.isCommitDataEnabled === 'true'

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
  async upsert(
    data,
    existing: boolean | any = false,
    fireCrowdWebhooks: boolean = true,
    fireSync: boolean = true,
  ) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    const searchSyncService = new SearchSyncService(this.options)
    const repositoryOptions = { ...this.options, transaction }

    try {
      if (data.member) {
        data.member = await MemberRepository.filterIdInTenant(data.member, repositoryOptions)
      }

      // check type exists, if doesn't exist, create a placeholder type with activity type key
      if (
        data.platform &&
        data.type &&
        !SegmentRepository.activityTypeExists(data.platform, data.type, repositoryOptions)
      ) {
        await new SegmentService(repositoryOptions).createActivityType(
          { type: data.type },
          data.platform,
        )
        await SegmentService.refreshSegments(repositoryOptions)
      }

      // check if channel exists in settings for respective platform. If not, update by adding channel to settings
      if (data.platform && data.channel) {
        await new SegmentService(repositoryOptions).updateActivityChannels(data)
        await SegmentService.refreshSegments(repositoryOptions)
      }

      // If a sourceParentId is sent, try to find it in our db
      if ('sourceParentId' in data && data.sourceParentId) {
        const parent = await ActivityRepository.findOne(
          {
            filter: {
              and: [{ sourceId: { eq: data.sourceParentId } }],
            },
          },
          repositoryOptions,
        )
        if (parent) {
          data.parent = await ActivityRepository.filterIdInTenant(parent.id, repositoryOptions)
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
          attributes: (oldValue, newValue) => {
            if (oldValue && newValue) {
              const out = { ...oldValue, ...newValue }
              // If either of the two has isMainBranch set to true, then set it to true
              if (oldValue.isMainBranch || newValue.isMainBranch) {
                out.isMainBranch = true
              }
              return out
            }
            return newValue
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          organizationId: (oldValue, _newValue) => oldValue,
        })
        await updateActivity(this.options.qdb, id, toUpdate)
        record = await ActivityRepository.update(id, toUpdate, repositoryOptions)
        if (data.parent) {
          await this.addToConversation(record.id, data.parent, transaction)
        }
      } else {
        if (!data.sentiment) {
          const sentiment = await this.getSentiment(data)
          data.sentiment = sentiment
        }

        if (
          !data.username &&
          (data.platform === PlatformType.OTHER ||
            // we have some custom platform types in db that are not in enum
            !Object.values(PlatformType).includes(data.platform))
        ) {
          const qx = SequelizeRepository.getQueryExecutor(repositoryOptions, transaction)
          const { displayName } = await findMemberById(qx, data.member, [MemberField.DISPLAY_NAME])
          // Get the first key of the username object as a string
          data.username = displayName
        }

        const memberAffilationService = new MemberAffiliationService(this.options)
        data.organizationId = await memberAffilationService.findAffiliation(
          data.member,
          data.timestamp,
        )

        record = await ActivityRepository.create(data, repositoryOptions)
        await insertActivities([{ ...data, id: record.id }], true)

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
          const children = await queryActivities(
            repositoryOptions.qdb,
            {
              tenantId: record.tenantId,
              segmentIds: [record.segmentId],
              filter: { and: [{ sourceParentId: { eq: data.sourceId } }] },
            },
            DEFAULT_COLUMNS_TO_SELECT,
          )

          const memberIds = distinct(children.rows.map((c) => c.memberId))
          if (memberIds.length > 0) {
            const memberResults = await queryMembersAdvanced(
              optionsQx(repositoryOptions),
              repositoryOptions.redis,
              repositoryOptions.currentTenant.id,
              {
                filter: { and: [{ id: { in: memberIds } }] },
                limit: memberIds.length,
              },
            )

            for (const activity of children.rows) {
              const member = singleOrDefault(memberResults.rows, (m) => m.id === activity.memberId)
              if (member) {
                activity.member = member
              }
            }
          }

          for (const child of children.rows) {
            // update children with newly created parentId
            await updateActivity(this.options.qdb, child.id, { ...record, parentId: record.id })
            await ActivityRepository.update(child.id, { parent: record.id }, repositoryOptions)

            // manage conversations for each child
            await this.addToConversation(child.id, record.id, transaction)
          }
        }
      }

      await SequelizeRepository.commitTransaction(transaction)

      if (fireSync) {
        await searchSyncService.triggerMemberSync(this.options.currentTenant.id, record.memberId, {
          withAggs: true,
        })
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

    // When we implement Kern.ais's sentiment, we will get rid of this. In the meantime, we use Vader
    // because we don't have an agreement with LF for comprehend.
    if (IS_GITHUB_COMMIT_DATA_ENABLED) {
      const text = data.sourceParentId ? data.body : `${data.title} ${data.body}`
      const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(text)
      const compound = Math.round(((sentiment.compound + 1) / 2) * 100)
      // Some activities are inherently different, we might want to dampen their sentiment

      let label = 'neutral'
      if (compound < 33) {
        label = 'negative'
      } else if (compound > 66) {
        label = 'positive'
      }

      return {
        positive: Math.round(sentiment.pos * 100),
        negative: Math.round(sentiment.neg * 100),
        neutral: Math.round(sentiment.neu * 100),
        mixed: Math.round(sentiment.neu * 100),
        sentiment: compound,
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
      await addActivityToConversation(this.options.qdb, parent.id, conversation.id)
    } else {
      // neither child nor parent is in a conversation, create one from parent
      const conversationTitle = await conversationService.generateTitle(
        parent.title || parent.body,
        ActivityService.hasHtmlActivities(parent.platform),
      )
      conversation = await conversationService.create({
        title: conversationTitle,
        published: false,
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
    const options: IRepositoryOptions = { ...this.options, transaction }
    // An activity is unique by it's sourceId and tenantId
    const exists = await ActivityRepository.findOne(
      {
        filter: {
          and: [{ sourceId: { eq: data.sourceId } }],
        },
      },
      options,
    )
    return exists || false
  }

  async createWithMember(data) {
    const logger = this.options.log
    const dataSinkWorkerEmitter = await getDataSinkWorkerEmitter()

    try {
      data.member.username = mapUsernameToIdentities(data.member.username, data.platform)

      if (!data.username) {
        data.username = data.member.username[data.platform][0].value
      }

      logger.trace(
        { type: data.type, platform: data.platform, username: data.username },
        'Processing activity with member!',
      )

      data.member.identities = ActivityService.processMemberIdentities(data.member, data.platform)
      data.isContribution = data.isContribution || false

      // prepare objectMember for dataSinkWorker
      if (data.objectMember) {
        data.objectMember.username = mapUsernameToIdentities(
          data.objectMember.username,
          data.platform,
        )

        if (!data.objectMember.username[data.platform]) {
          throw new Error(`objectMember username for ${data.platform} is missing!`)
        }

        data.objectMemberUsername = data.objectMember.username[data.platform][0].value
        data.objectMember.identities = ActivityService.processMemberIdentities(
          data.objectMember,
          data.platform,
        )
      }

      if (data.member.organizations) {
        data.member.organizations.forEach((org) => {
          org.identities = [
            {
              name: org.name || org.website,
              platform: data.platform,
            },
          ]
        })
      }

      // TODO:: Make a proper GDPR prevention
      if (
        data.member.identities &&
        data.member.identities.length > 0 &&
        data.member.identities.some((i) => i.value.toLowerCase() === 'lf_disabled@oesterle.dev')
      ) {
        return
      }

      const resultId = await ActivityRepository.createResults(
        {
          type: IntegrationResultType.ACTIVITY,
          data,
        },
        this.options,
      )

      logger.trace(
        { type: data.type, platform: data.platform, username: data.username, processedData: data },
        'Sending activity with member to data-sink-worker!',
      )

      await dataSinkWorkerEmitter.triggerResultProcessing(
        this.options.currentTenant.id,
        data.platform,
        resultId,
        resultId,
        true,
      )
    } catch (error) {
      this.log.error(error, 'Error during activity create with member!')
      throw error
    }
  }

  async update(id, data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    const searchSyncService = new SearchSyncService(this.options)

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

      await searchSyncService.triggerMemberSync(this.options.currentTenant.id, record.memberId, {
        withAggs: true,
      })
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
      await deleteActivities(this.options.qdb, ids)
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

  async findActivityTypes(segments?: string[]) {
    const segmentService = new SegmentService(this.options)

    let subprojects: SegmentData[]

    if (!segments || segments.length === 0) {
      subprojects = await segmentService.getTenantSubprojects()
    } else {
      subprojects = await segmentService.getSegmentSubprojects(segments)
    }

    return SegmentService.getTenantActivityTypes(subprojects)
  }

  async findActivityChannels(segments?: string[]) {
    const segmentService = new SegmentService(this.options)

    let subprojects: SegmentData[]

    if (!segments || segments.length === 0) {
      subprojects = await segmentService.getTenantSubprojects()
    } else {
      subprojects = await segmentService.getSegmentSubprojects(segments)
    }

    return SegmentService.getTenantActivityChannels(
      subprojects.map((s) => s.id),
      this.options,
    )
  }

  async query(data) {
    const filter = data.filter
    const orderBy = Array.isArray(data.orderBy) ? data.orderBy : [data.orderBy]
    const limit = data.limit
    const offset = data.offset
    const countOnly = data.countOnly ?? false

    const tenantId = SequelizeRepository.getCurrentTenant(this.options).id
    const segmentIds = SequelizeRepository.getSegmentIds(this.options)

    const page = await queryActivities(
      this.options.qdb,
      {
        tenantId,
        segmentIds,
        filter,
        orderBy,
        limit,
        offset,
        countOnly,
      },
      DEFAULT_COLUMNS_TO_SELECT,
    )

    // const parentIds: string[] = []
    const memberIds: string[] = []
    const organizationIds: string[] = []
    for (const row of page.rows) {
      ;(row as any).display = ActivityDisplayService.getDisplayOptions(
        row,
        SegmentRepository.getActivityTypes(this.options),
      )

      // if (row.parentId && !parentIds.includes(row.parentId)) {
      //   parentIds.push(row.parentId)
      // }

      if (row.memberId && !memberIds.includes(row.memberId)) {
        memberIds.push(row.memberId)
      }

      if (row.objectMemberId && !memberIds.includes(row.objectMemberId)) {
        memberIds.push(row.objectMemberId)
      }

      if (row.organizationId && !organizationIds.includes(row.organizationId)) {
        organizationIds.push(row.organizationId)
      }
    }

    const promises = []
    if (organizationIds.length > 0) {
      promises.push(
        OrganizationRepository.findAndCountAll(
          {
            filter: {
              and: [{ id: { in: organizationIds } }],
            },
            limit: organizationIds.length,
            include: { identities: true, lfxMemberships: true },
          },
          this.options,
        ).then((organizations) => {
          for (const row of page.rows.filter((r) => r.organizationId)) {
            ;(row as any).organization = singleOrDefault(
              organizations.rows,
              (o) => o.id === row.organizationId,
            )
          }
        }),
      )
    }
    // if (parentIds.length > 0) {
    //   promises.push(
    //     queryActivities(this.options.qdb, {
    //       filter: {
    //         and: [{ id: { in: parentIds } }],
    //       },
    //       tenantId,
    //       segmentIds,
    //       noLimit: true,
    //     }).then((activities) => {
    //       for (const row of page.rows.filter((r) => r.parentId)) {
    //         ;(row as any).parent = singleOrDefault(activities.rows, (a) => a.id === row.parentId)
    //       }
    //     }),
    //   )
    // }
    if (memberIds.length > 0) {
      promises.push(
        queryMembersAdvanced(
          optionsQx(this.options),
          this.options.redis,
          this.options.currentTenant.id,
          {
            filter: { and: [{ id: { in: memberIds } }] },
            limit: memberIds.length,
          },
        ).then((members) => {
          for (const row of page.rows) {
            row.member = singleOrDefault(members.rows, (m) => m.id === row.memberId)

            if (row.objectMemberId) {
              row.objectMember = singleOrDefault(members.rows, (m) => m.id === row.objectMemberId)
            }
          }
        }),
      )
    }

    await Promise.all(promises)

    return page
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

  async _isImportHashExistent(importHash: string) {
    const count = await ActivityRepository.findOne(
      {
        filter: {
          and: [{ importHash: { eq: importHash } }],
        },
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

  static processMemberIdentities(
    member: {
      username: UsernameIdentities
      emails: string[]
    },
    platform: string,
  ): IMemberIdentity[] {
    const identities = []

    if (member.username) {
      Object.keys(member.username).forEach((platform) => {
        identities.push({
          platform,
          value: member.username[platform][0].value,
          type: member.username[platform][0].type,
          verified: true,
        })
      })
    }

    if (member.emails) {
      member.emails.forEach((email) => {
        identities.push({
          platform,
          value: email,
          type: 'email',
          verified: true,
        })
      })
    }

    return identities
  }
}
