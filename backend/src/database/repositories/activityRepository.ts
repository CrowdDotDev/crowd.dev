import { Error400, Error404 } from '@crowd/common'
import { ActivityDisplayService } from '@crowd/integrations'
import lodash from 'lodash'
import sanitizeHtml from 'sanitize-html'
import {
  IQueryActivitiesParameters,
  deleteActivities,
  insertActivities,
  queryActivities,
  updateActivity,
} from '@crowd/data-access-layer'
import { IRepositoryOptions } from './IRepositoryOptions'
import AuditLogRepository from './auditLogRepository'
import SegmentRepository from './segmentRepository'
import SequelizeRepository from './sequelizeRepository'

const log: boolean = false

class ActivityRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(options)

    // Data and body will be displayed as HTML. We need to sanitize them.
    if (data.body) {
      data.body = sanitizeHtml(data.body).trim()
    }

    if (data.title) {
      data.title = sanitizeHtml(data.title).trim()
    }

    if (data.sentiment) {
      this._validateSentiment(data.sentiment)
    }

    // type and platform to lowercase
    if (data.type) {
      data.type = data.type.toLowerCase()
    }
    if (data.platform) {
      data.platform = data.platform.toLowerCase()
    }

    const ids = await insertActivities([
      {
        type: data.type,
        timestamp: data.timestamp,
        isContribution: data.isContribution,
        score: data.score,
        parentId: data.parent || undefined,
        sourceId: data.sourceId,
        sourceParentId: data.sourceParentId || undefined,
        tenantId: tenant.id,
        segmentId: segment.id,
        memberId: data.member || undefined,
        username: data.username,
        objectMemberId: data.objectMember || undefined,
        objectMemberUsername: data.objectMemberUsername,
        sentiment: data.sentiment,
        attributes: data.attributes,
        body: data.body,
        title: data.title,
        channel: data.channel,
        url: data.url,
        organizationId: data.organizationId || undefined,
        platform: data.platform,
        conversationId: data.conversationId || undefined,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
    ])

    // TODO uros set tasks if any
    // await record.setTasks(data.tasks || [], {
    //   transaction,
    // })

    if (ids.length !== 1) {
      throw new Error('Activity was not created!')
    }

    const record = await this.findById(ids[0], options)

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return record
  }

  /**
   * Check whether sentiment data is valid
   * @param sentimentData Object: {positive: number, negative: number, mixed: number, neutral: number, sentiment: 'positive' | 'negative' | 'mixed' | 'neutral'}
   */
  static _validateSentiment(sentimentData) {
    if (!lodash.isEmpty(sentimentData)) {
      const moods = ['positive', 'negative', 'mixed', 'neutral']
      for (const prop of moods) {
        if (typeof sentimentData[prop] !== 'number') {
          throw new Error400('en', 'activity.error.sentiment.mood')
        }
      }
      if (!moods.includes(sentimentData.label)) {
        throw new Error400('en', 'activity.error.sentiment.label')
      }
      if (typeof sentimentData.sentiment !== 'number') {
        throw new Error('activity.error.sentiment.sentiment')
      }
    }
  }

  static async update(id: string, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(options)

    // Data and body will be displayed as HTML. We need to sanitize them.
    if (data.body) {
      data.body = sanitizeHtml(data.body).trim()
    }
    if (data.title) {
      data.title = sanitizeHtml(data.title).trim()
    }

    if (data.sentiment) {
      this._validateSentiment(data.sentiment)
    }

    const record = await this.findById(id, options)

    await updateActivity(options.qdb, id, {
      type: data.type,
      isContribution: data.isContribution,
      score: data.score,
      parentId: data.parent || undefined,
      sourceId: data.sourceId,
      sourceParentId: data.sourceParentId || undefined,
      tenantId: currentTenant.id,
      segmentId: segment.id,
      memberId: data.member || undefined,
      username: data.username,
      objectMemberId: data.objectMember || undefined,
      objectMemberUsername: data.objectMemberUsername,
      sentiment: data.sentiment,
      attributes: data.attributes,
      body: data.body,
      title: data.title,
      channel: data.channel,
      url: data.url,
      organizationId: data.organizationId,
      platform: data.platform,
      conversationId: data.conversationId || undefined,
      updatedById: currentUser.id,
    })

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async destroy(id: string, options: IRepositoryOptions) {
    const record = await this.findById(id, options, false)

    if (!record) {
      throw new Error404()
    }

    await deleteActivities(options.qdb, [id])

    await this._createAuditLog(AuditLogRepository.DELETE, record, record, options)
  }

  static async findById(id: string, options: IRepositoryOptions, loadChildren = true) {
    const currentTenant = SequelizeRepository.getCurrentTenant(options)
    const segmentIds = SequelizeRepository.getSegmentIds(options)

    const results = await queryActivities(options.qdb, {
      filter: {
        and: [{ id: { eq: id } }],
      },
      tenantId: currentTenant.id,
      segmentIds,
      limit: 1,
    })

    if (results.rows.length === 0) {
      throw new Error404(`Activity with id ${id} is not found!`)
    }

    if (loadChildren) {
      return this._populateRelations(results.rows[0], true, options)
    }

    return this._populateRelations(results.rows[0], false, options)
  }

  /**
   * Find a record in the database given a query.
   * @param query Query to find by
   * @param options Repository options
   * @returns The found record. Null if none is found.
   */
  static async findOne(
    arg: IQueryActivitiesParameters,
    options: IRepositoryOptions,
  ): Promise<any | null> {
    const currentTenant = SequelizeRepository.getCurrentTenant(options)
    const segmentIds = SequelizeRepository.getSegmentIds(options)

    arg.limit = 1
    arg.tenantId = currentTenant.id
    arg.segmentIds = segmentIds

    const results = await queryActivities(options.qdb, arg)

    if (results.rows.length === 0) {
      return null
    }

    return this._populateRelations(results.rows[0], true, options)
  }

  static async filterIdInTenant(id, options: IRepositoryOptions) {
    return lodash.get(await this.filterIdsInTenant([id], options), '[0]', null)
  }

  static async filterIdsInTenant(ids: string[], options: IRepositoryOptions) {
    if (!ids || !ids.length) {
      return []
    }

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const records = await queryActivities(
      options.qdb,
      {
        filter: {
          and: [{ id: { in: ids } }],
        },
        tenantId: currentTenant.id,
        segmentIds: SequelizeRepository.getSegmentIds(options),
        limit: ids.length,
      },
      ['id'],
    )

    return records.rows.map((record) => record.id)
  }

  static async _createAuditLog(action, record, data, options: IRepositoryOptions) {
    if (log) {
      let values = {}

      if (data) {
        values = {
          ...record.get({ plain: true }),
        }
      }

      await AuditLogRepository.log(
        {
          entityName: 'activity',
          entityId: record.id,
          action,
          values,
        },
        options,
      )
    }
  }

  static async _populateRelationsForRows(rows, loadTasks: boolean, options: IRepositoryOptions) {
    if (!rows) {
      return rows
    }

    return Promise.all(rows.map((record) => this._populateRelations(record, loadTasks, options)))
  }

  static async _populateRelations(record: any, loadChildren: boolean, options: IRepositoryOptions) {
    if (!record) {
      return record
    }

    const output = { ...record }

    output.display = ActivityDisplayService.getDisplayOptions(
      record,
      SegmentRepository.getActivityTypes(options),
    )

    if (output.parent) {
      output.parent.display = ActivityDisplayService.getDisplayOptions(
        output.parent,
        SegmentRepository.getActivityTypes(options),
      )
    }

    // if (loadChildren) {
    // TODO uros load tasks
    // }

    return output
  }
}

export default ActivityRepository
