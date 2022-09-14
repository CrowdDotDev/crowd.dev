import lodash from 'lodash'
import Sequelize from 'sequelize'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import Error404 from '../../errors/Error404'
import { IRepositoryOptions } from './IRepositoryOptions'
import { SERVICE, getConfig } from '../../config'
import { ServiceType } from '../../config/configTypes'

const { Op } = Sequelize

const log: boolean = false

class CommunityMemberRepository {
  static async create(data, options: IRepositoryOptions, doPupulateRelations = true) {
    // If crowdUsername is not in the username dict, we need to add it
    if (!('crowdUsername' in data.username)) {
      data.username.crowdUsername = Object.values(data.username)[0]
    }

    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.communityMember.create(
      {
        ...lodash.pick(data, [
          'username',
          'info',
          'crowdInfo',
          'type',
          'email',
          'score',
          'bio',
          'organisation',
          'location',
          'signals',
          'reach',
          'joinedAt',
          'importHash',
        ]),

        tenantId: tenant.id,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await record.setActivities(data.activities || [], {
      transaction,
    })
    await record.setTags(data.tags || [], {
      transaction,
    })
    await record.setNoMerge(data.noMerge || [], {
      transaction,
    })
    await record.setToMerge(data.toMerge || [], {
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return this.findById(record.id, options, true, doPupulateRelations)
  }

  static async findMembersWithMergeSuggestions(options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const include = [
      {
        model: options.database.communityMember,
        as: 'toMerge',
        through: {
          attributes: [],
        },
        required: true,
      },
    ]

    const { rows, count } = await options.database.communityMember.findAndCountAll({
      where: {
        tenantId: currentTenant.id,
      },
      include,
      transaction,
    })

    return { rows, count }
  }

  static async addToMerge(id, toMergeId, options: IRepositoryOptions) {
    const returnPlain = false

    const member = await this.findById(id, options, returnPlain)

    const toMergeMember = await this.findById(toMergeId, options, returnPlain)

    await member.addToMerge(toMergeMember)

    return this.findById(id, options)
  }

  static async removeToMerge(id, toMergeId, options: IRepositoryOptions) {
    const returnPlain = false

    const member = await this.findById(id, options, returnPlain)

    const toMergeMember = await this.findById(toMergeId, options, returnPlain)

    await member.removeToMerge(toMergeMember)

    return this.findById(id, options)
  }

  static async addNoMerge(id, toMergeId, options: IRepositoryOptions) {
    const returnPlain = false

    const member = await this.findById(id, options, returnPlain)

    const toMergeMember = await this.findById(toMergeId, options, returnPlain)

    await member.addNoMerge(toMergeMember)

    return this.findById(id, options)
  }

  static async removeNoMerge(id, toMergeId, options: IRepositoryOptions) {
    const returnPlain = false

    const member = await this.findById(id, options, returnPlain)

    const toMergeMember = await this.findById(toMergeId, options, returnPlain)

    await member.removeNoMerge(toMergeMember)

    return this.findById(id, options)
  }

  static async findOne(query, options: IRepositoryOptions, doPupulateRelations = true) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.communityMember.findOne({
      where: {
        tenantId: currentTenant.id,
        ...query,
      },
      transaction,
    })

    if (doPupulateRelations) {
      return this._populateRelations(record, options)
    }
    return record.get({ plain: true })
  }

  static async memberExists(
    username,
    platform,
    options: IRepositoryOptions,
    doPupulateRelations = true,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const query =
      'SELECT "id", "username", "type", "info", "crowdInfo", "email", "score", "bio", "organisation", "location", "signals", "reach", "joinedAt", "importHash", "createdAt", "updatedAt", "deletedAt", "tenantId", "createdById", "updatedById" FROM "communityMembers" AS "communityMember" WHERE ("communityMember"."deletedAt" IS NULL AND ("communityMember"."tenantId" = $tenantId AND ("communityMember"."username"->>$platform) = $username)) LIMIT 1;'

    const records = await options.database.sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
      bind: {
        tenantId: currentTenant.id,
        platform,
        username,
      },
      transaction,
      model: options.database.communityMember,
      limit: 1,
    })
    if (records.length === 0) {
      return null
    }
    if (doPupulateRelations) {
      return this._populateRelations(records[0], options)
    }
    return records[0].get({ plain: true })
  }

  static async update(id, data, options: IRepositoryOptions, doPupulateRelations = true) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    let record = await options.database.communityMember.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    record = await record.update(
      {
        ...lodash.pick(data, [
          'username',
          'info',
          'crowdInfo',
          'type',
          'email',
          'score',
          'bio',
          'organisation',
          'location',
          'signals',
          'reach',
          'joinedAt',
          'importHash',
        ]),

        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    if (data.activities) {
      await record.setActivities(data.activities || [], {
        transaction,
      })
    }

    if (data.tags) {
      await record.setTags(data.tags || [], {
        transaction,
      })
    }

    if (data.noMerge) {
      await record.setNoMerge(data.noMerge || [], {
        transaction,
      })
    }

    if (data.toMerge) {
      await record.setToMerge(data.toMerge || [], {
        transaction,
      })
    }

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options, true, doPupulateRelations)
  }

  static async destroy(id, options: IRepositoryOptions, force = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.communityMember.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    await record.destroy({
      force,
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.DELETE, record, record, options)
  }

  static async destroyBulk(ids, options: IRepositoryOptions, force = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    await options.database.communityMember.destroy({
      where: {
        id: ids,
        tenantId: currentTenant.id,
      },
      force,
      transaction,
    })
  }

  static async findById(
    id,
    options: IRepositoryOptions,
    returnPlain = true,
    doPupulateRelations = true,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.communityMember.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      include,
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    if (doPupulateRelations) {
      return this._populateRelations(record, options, returnPlain)
    }
    return record.get({ plain: returnPlain })
  }

  static async filterIdInTenant(id, options: IRepositoryOptions) {
    return lodash.get(await this.filterIdsInTenant([id], options), '[0]', null)
  }

  static async filterIdsInTenant(ids, options: IRepositoryOptions) {
    if (!ids || !ids.length) {
      return []
    }

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const where = {
      id: {
        [Op.in]: ids,
      },
      tenantId: currentTenant.id,
    }

    const records = await options.database.communityMember.findAll({
      attributes: ['id'],
      where,
      transaction,
    })

    return records.map((record) => record.id)
  }

  static async count(filter, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    return options.database.communityMember.count({
      where: {
        ...filter,
        tenantId: tenant.id,
      },
      transaction,
    })
  }

  static async findAndCountAll(
    { filter, limit = 0, offset = 0, orderBy = '' },
    options: IRepositoryOptions,
  ) {
    const tenant = SequelizeRepository.getCurrentTenant(options)

    const literalReachTotal = Sequelize.literal(`("communityMember".reach->'total')::int`)
    const computedActivitiesCount = Sequelize.literal(
      `(SELECT COUNT(*) FROM activities WHERE activities."communityMemberId" = "communityMember".id )`,
    )

    const whereAnd: Array<any> = []
    const customOrderBy: Array<any> = []
    const include = [
      {
        model: options.database.activity,
        as: 'activities',
        separate: true,
      },
      {
        model: options.database.communityMember,
        as: 'toMerge',
        attributes: ['id'],
        through: {
          attributes: [],
        },
      },
      {
        model: options.database.communityMember,
        as: 'noMerge',
        attributes: ['id'],
        through: {
          attributes: [],
        },
      },
    ]

    if (orderBy.includes('activitiesCount')) {
      customOrderBy.push([computedActivitiesCount, orderBy.split('_')[1]])
    }

    if (orderBy.includes('reach')) {
      customOrderBy.push([literalReachTotal, orderBy.split('_')[1]])
    }

    whereAnd.push({
      tenantId: tenant.id,
    })

    if (filter) {
      if (filter.id) {
        whereAnd.push({
          id: SequelizeFilterUtils.uuid(filter.id),
        })
      }

      if (filter.platform) {
        whereAnd.push(
          SequelizeFilterUtils.jsonbILikeIncludes('communityMember', 'username', filter.platform),
        )
      }

      if (filter.username) {
        whereAnd.push(
          SequelizeFilterUtils.jsonbILikeIncludes('communityMember', 'username', filter.username),
        )
      }

      if (filter.info) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('communityMember', 'info', filter.info))
      }

      if (filter.crowdInfo) {
        whereAnd.push({
          crowdInfo: filter.crowdInfo,
        })
      }

      if (filter.type) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('communityMember', 'type', filter.type))
      }

      if (filter.tags) {
        const whereTags = filter.tags.reduce((acc, item, index) => {
          if (index === 0) {
            return `${acc} "communityMemberTags"."tagId"  = '${SequelizeFilterUtils.uuid(item)}'`
          }
          return `${acc} OR "communityMemberTags"."tagId"  = '${SequelizeFilterUtils.uuid(item)}'`
        }, '')

        const tagFilterLiteral = Sequelize.literal(
          `(SELECT "communityMembers".id FROM "communityMembers" INNER JOIN "communityMemberTags" ON "communityMemberTags"."communityMemberId" = "communityMembers".id WHERE ${whereTags})`,
        )

        whereAnd.push({
          id: {
            [Op.in]: tagFilterLiteral,
          },
        })
      }

      if (filter.email) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('communityMember', 'email', filter.email))
      }

      if (filter.scoreRange) {
        const [start, end] = filter.scoreRange

        if (start !== undefined && start !== null && start !== '') {
          whereAnd.push({
            score: {
              [Op.gte]: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          whereAnd.push({
            score: {
              [Op.lte]: end,
            },
          })
        }
      }

      if (filter.bio) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('communityMember', 'bio', filter.bio))
      }

      if (filter.organisation) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes(
            'communityMember',
            'organisation',
            filter.organisation,
          ),
        )
      }

      if (filter.location) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes('communityMember', 'location', filter.location),
        )
      }

      if (filter.signals) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes('communityMember', 'signals', filter.signals),
        )
      }

      if (filter.reachRange) {
        const [start, end] = filter.reachRange

        if (start !== undefined && start !== null && start !== '') {
          whereAnd.push({
            'reach.total::int': {
              [Op.gte]: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          whereAnd.push({
            'reach.total::int': {
              [Op.lte]: end,
            },
          })
        }
      }

      if (filter.joinedAtRange) {
        const [start, end] = filter.joinedAtRange

        if (start !== undefined && start !== null && start !== '') {
          whereAnd.push({
            joinedAt: {
              [Op.gte]: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          whereAnd.push({
            joinedAt: {
              [Op.lte]: end,
            },
          })
        }
      }

      if (filter.createdAtRange) {
        const [start, end] = filter.createdAtRange

        if (start !== undefined && start !== null && start !== '') {
          whereAnd.push({
            createdAt: {
              [Op.gte]: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          whereAnd.push({
            createdAt: {
              [Op.lte]: end,
            },
          })
        }
      }
    }

    const where = { [Op.and]: whereAnd }

    let order

    if (customOrderBy.length > 0) {
      order = [customOrderBy]
    } else if (orderBy) {
      order = [orderBy.split('_')]
    } else {
      order = [['joinedAt', 'DESC']]
    }

    let {
      rows,
      count, // eslint-disable-line prefer-const
    } = await options.database.communityMember.findAndCountAll({
      where,
      include,
      attributes: {
        include: [[computedActivitiesCount, 'activitiesCount']],
      },
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
      order,
      subQuery: false,
      distinct: true,
    })

    rows = await this._populateRelationsForRows(rows)

    return { rows, count }
  }

  static async findAllAutocomplete(query, limit, options: IRepositoryOptions) {
    const tenant = SequelizeRepository.getCurrentTenant(options)

    const whereAnd: Array<any> = [
      {
        tenantId: tenant.id,
      },
    ]

    if (query) {
      whereAnd.push({
        [Op.or]: [
          {
            'username.crowdUsername': {
              [Op.iLike]: `${query}%`,
            },
          },
        ],
      })
    }

    const where = { [Op.and]: whereAnd }

    const records = await options.database.communityMember.findAll({
      attributes: ['id', 'username'],
      where,
      limit: limit ? Number(limit) : undefined,
      order: [['username', 'ASC']],
    })

    return records.map((record) => ({
      id: record.id,
      label: record.username.crowdUsername,
    }))
  }

  static async _createAuditLog(action, record, data, options: IRepositoryOptions) {
    if (log) {
      let values = {}

      if (data) {
        values = {
          ...record.get({ plain: true }),
          activitiesIds: data.activities,
          tagsIds: data.tags,
          noMergeIds: data.noMerge,
        }
      }

      await AuditLogRepository.log(
        {
          entityName: 'communityMember',
          entityId: record.id,
          action,
          values,
        },
        options,
      )
    }
  }

  static async _populateRelationsForRows(rows) {
    if (!rows) {
      return rows
    }

    // No need for lazyloading tags for integrations or microservices
    if (
      getConfig().SERVICE === 'integrations' ||
      getConfig().SERVICE === 'microservices-nodejs' ||
      SERVICE === ServiceType.NODEJS_WORKER ||
      SERVICE === ServiceType.JOB_GENERATOR
    ) {
      return rows.map((record) => {
        const plainRecord = record.get({ plain: true })
        plainRecord.noMerge = plainRecord.noMerge.map((i) => i.id)
        plainRecord.toMerge = plainRecord.toMerge.map((i) => i.id)
        return plainRecord
      })
    }

    return Promise.all(
      rows.map(async (record) => {
        const plainRecord = record.get({ plain: true })
        plainRecord.noMerge = plainRecord.noMerge.map((i) => i.id)
        plainRecord.toMerge = plainRecord.toMerge.map((i) => i.id)
        plainRecord.tags = await record.getTags({
          joinTableAttributes: [],
        })
        return plainRecord
      }),
    )
  }

  /**
   * Fill a record with the relations and files (if any)
   * @param record Record to get relations and files for
   * @param options IRepository options
   * @param returnPlain If true: return object, otherwise  return model
   * @returns The model/object with filled relations and files
   */
  static async _populateRelations(record, options: IRepositoryOptions, returnPlain = true) {
    if (!record) {
      return record
    }

    let output

    if (returnPlain) {
      output = record.get({ plain: true })
    } else {
      output = record
    }

    const transaction = SequelizeRepository.getTransaction(options)

    output.activities = await record.getActivities({
      order: [['timestamp', 'DESC']],
      transaction,
    })

    output.tags = await record.getTags({
      transaction,
      joinTableAttributes: [],
    })

    output.noMerge = (
      await record.getNoMerge({
        transaction,
      })
    ).map((i) => i.id)

    output.toMerge = (
      await record.getToMerge({
        transaction,
      })
    ).map((i) => i.id)

    return output
  }
}

export default CommunityMemberRepository
