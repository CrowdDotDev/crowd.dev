import lodash from 'lodash'

import { DEFAULT_TENANT_ID, Error404, distinct, single } from '@crowd/common'
import {
  DEFAULT_COLUMNS_TO_SELECT,
  IQueryActivityResult,
  deleteConversations,
  getConversationById,
  insertConversation,
  queryActivities,
  queryMembersAdvanced,
  updateConversation,
} from '@crowd/data-access-layer'
import { IDbConversation } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/conversation.data'
import { optionsQx } from '@crowd/data-access-layer/src/queryExecutor'
import { ActivityDisplayService } from '@crowd/integrations'
import { PageData, PlatformType } from '@crowd/types'

import { IRepositoryOptions } from './IRepositoryOptions'
import AuditLogRepository from './auditLogRepository'
import SegmentRepository from './segmentRepository'
import SequelizeRepository from './sequelizeRepository'

class ConversationRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(options)

    const id = await insertConversation(options.qdb, {
      title: data.title,
      slug: data.slug,
      published: data.published,
      segmentId: segment.id,
      createdById: currentUser.id,
      updatedById: currentUser.id,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    })

    // still leave it in postgresql for now
    await options.database.conversation.create(
      {
        id,
        ...lodash.pick(data, ['title', 'slug', 'published']),
        tenantId: DEFAULT_TENANT_ID,
        segmentId: segment.id,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    const record = await this.findById(id, options)

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return record
  }

  static async update(id, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(options)

    const transaction = SequelizeRepository.getTransaction(options)

    let record = await options.database.conversation.findOne({
      where: {
        id,
        segmentId: SequelizeRepository.getSegmentIds(options),
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    await record.update(
      {
        ...lodash.pick(data, ['title', 'slug', 'published']),

        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await updateConversation(options.qdb, id, {
      segmentId: segment.id,
      title: data.title,
      slug: data.slug,
      published: data.published,
      updatedById: currentUser.id,
    })

    record = await this.findById(id, options)

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return record
  }

  static async destroy(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.conversation.findOne({
      where: {
        id,
        segmentId: SequelizeRepository.getSegmentIds(options),
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    await record.destroy({
      transaction,
    })

    await deleteConversations(options.qdb, [id])

    await this._createAuditLog(AuditLogRepository.DELETE, record, record, options)
  }

  static async findById(id, options: IRepositoryOptions) {
    // quest db for selects
    const conversation = await getConversationById(
      options.qdb,
      id,
      SequelizeRepository.getSegmentIds(options),
    )

    if (!conversation) {
      throw new Error404()
    }

    return this._populateRelations(conversation, options, ['activities'])
  }

  static async destroyBulk(ids: string[], options: IRepositoryOptions, force = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    await options.database.conversation.destroy({
      where: {
        id: ids,
        segmentId: SequelizeRepository.getSegmentIds(options),
      },
      force,
      transaction,
    })

    await deleteConversations(options.qdb, ids)
  }

  static async _createAuditLog(action, record, data, options: IRepositoryOptions) {
    let values = {}

    if (data) {
      values = {
        ...record.get({ plain: true }),
      }
    }

    await AuditLogRepository.log(
      {
        entityName: 'conversation',
        entityId: record.id,
        action,
        values,
      },
      options,
    )
  }

  static async _populateRelationsForRows(
    rows: IDbConversation[],
    options: IRepositoryOptions,
    lazyLoad: string[] = [],
  ) {
    if (!rows) {
      return rows
    }

    return Promise.all(
      rows.map(async (record) => this._populateRelations(record, options, lazyLoad)),
    )
  }

  static extractGitHubRepoPath(url) {
    if (!url) return null
    const match = url.match(/^https?:\/\/(www\.)?github.com\/(?<owner>[\w.-]+)\/(?<name>[\w.-]+)/)
    if (!match || !(match.groups?.owner && match.groups?.name)) return null
    return `${match.groups.owner}/${match.groups.name}`
  }

  static async _populateRelations(
    conversation: IDbConversation,
    options: IRepositoryOptions,
    lazyLoad: string[] = [],
  ) {
    if (!conversation) {
      return conversation
    }

    const output: any = { ...conversation }

    if (lazyLoad.includes('activities')) {
      const results = (await queryActivities(
        options.qdb,
        {
          filter: {
            and: [{ conversationId: { eq: conversation.id } }],
          },
          noLimit: true,
          segmentIds: [conversation.segmentId],
        },
        DEFAULT_COLUMNS_TO_SELECT,
      )) as PageData<IQueryActivityResult>

      // populate member
      const memberIds = distinct(results.rows.map((a) => a.memberId))
      if (memberIds.length > 0) {
        const memberResults = await queryMembersAdvanced(optionsQx(options), options.redis, {
          filter: { and: [{ id: { in: memberIds } }] },
          limit: memberIds.length,
        })

        for (const activity of results.rows) {
          ;(activity as any).member = memberResults.rows.find((m) => m.id === activity.memberId)
          ;(activity as any).display = ActivityDisplayService.getDisplayOptions(
            activity,
            SegmentRepository.getActivityTypes(options),
          )
        }
      }

      // find the conversation starter
      const firstActivity = single(
        results.rows,
        (a) => a.conversationId === conversation.id && a.parentId === null,
      )

      const remainingActivities = results.rows
        .filter((a) => a.parentId !== null)
        .sort(
          (a, b) =>
            // from oldest to newest
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        )

      output.activities = [firstActivity, ...remainingActivities]

      output.memberCount = results.rows
        .map((row) => row.memberId)
        .filter((item, index, arr) => arr.indexOf(item) === index).length

      output.conversationStarter = output.activities[0] ?? null
      output.activityCount = output.activities.length
      output.platform = null
      output.channel = null
      output.lastActive = null

      if (output.activityCount > 0) {
        output.platform = output.activities[0].platform ?? null
        output.lastActive = output.activities[output.activities.length - 1].timestamp
        output.channel = output.activities[0].channel ? output.activities[0].channel : null

        if (output.platform && output.platform === PlatformType.GITHUB) {
          output.channel = this.extractGitHubRepoPath(output.channel)
        }
      }
    }

    return output
  }
}

export default ConversationRepository
