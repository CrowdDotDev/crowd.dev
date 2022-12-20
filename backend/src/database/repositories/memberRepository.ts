import lodash from 'lodash'
import Sequelize, { QueryTypes } from 'sequelize'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import Error404 from '../../errors/Error404'
import { IRepositoryOptions } from './IRepositoryOptions'
import QueryParser from './filters/queryParser'
import { QueryOutput } from './filters/queryTypes'
import { AttributeData } from '../attributes/attribute'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import { KUBE_MODE, SERVICE } from '../../config'
import { ServiceType } from '../../config/configTypes'
import { AttributeType } from '../attributes/types'
import TenantRepository from './tenantRepository'

const { Op } = Sequelize

const log: boolean = false

class MemberRepository {
  static async create(data, options: IRepositoryOptions, doPopulateRelations = true) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.member.create(
      {
        ...lodash.pick(data, [
          'username',
          'displayName',
          'attributes',
          'email',
          'score',
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
    await record.setOrganizations(data.organizations || [], {
      transaction,
    })

    await record.setTasks(data.tasks || [], {
      transaction,
    })

    await record.setNotes(data.notes || [], {
      transaction,
    })

    await record.setNoMerge(data.noMerge || [], {
      transaction,
    })
    await record.setToMerge(data.toMerge || [], {
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return this.findById(record.id, options, true, doPopulateRelations)
  }

  static async findMembersWithMergeSuggestions(
    { limit = 20, offset = 0 },
    options: IRepositoryOptions,
  ) {
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const mems = await options.database.sequelize.query(
      `SELECT 
      "membersToMerge".id, 
      "membersToMerge"."toMergeId",
      "membersToMerge"."total_count"
       FROM 
       (
        SELECT DISTINCT ON (Greatest(Hashtext(Concat(mem.id, mtm."toMergeId")), Hashtext(Concat(mtm."toMergeId", mem.id)))) 
            mem.id, 
            mtm."toMergeId", 
            mem."joinedAt", 
            COUNT(*) OVER() AS total_count 
          FROM 
            members mem 
            INNER JOIN "memberToMerge" mtm ON mem.id = mtm."memberId" 
          WHERE 
            mem."tenantId" = :tenantId
        ) AS "membersToMerge" 
      ORDER BY 
        "membersToMerge"."joinedAt" DESC 
      LIMIT :limit OFFSET :offset
    `,
      {
        replacements: {
          tenantId: currentTenant.id,
          limit,
          offset,
        },
        type: QueryTypes.SELECT,
      },
    )

    if (mems.length > 0) {
      const memberPromises = []
      const toMergePromises = []

      for (const mem of mems) {
        memberPromises.push(MemberRepository.findById(mem.id, options))
        toMergePromises.push(MemberRepository.findById(mem.toMergeId, options))
      }

      const memberResults = await Promise.all(memberPromises)
      const memberToMergeResults = await Promise.all(toMergePromises)

      const result = memberResults.map((i, idx) => [i, memberToMergeResults[idx]])
      return { rows: result, count: mems[0].total_count / 2, limit, offset }
    }

    return { rows: [], count: 0, limit, offset }
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

  static async findOne(query, options: IRepositoryOptions, doPopulateRelations = true) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.member.findOne({
      where: {
        tenantId: currentTenant.id,
        ...query,
      },
      transaction,
    })

    if (doPopulateRelations) {
      return this._populateRelations(record, options)
    }
    return record.get({ plain: true })
  }

  static async memberExists(
    username,
    platform,
    options: IRepositoryOptions,
    doPopulateRelations = true,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const query =
      'SELECT "id", "username", "displayName", "attributes", "email", "score", "reach", "joinedAt", "importHash", "createdAt", "updatedAt", "deletedAt", "tenantId", "createdById", "updatedById" FROM "members" AS "member" WHERE ("member"."deletedAt" IS NULL AND ("member"."tenantId" = $tenantId AND ("member"."username"->>$platform) = $username)) LIMIT 1;'

    const records = await options.database.sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
      bind: {
        tenantId: currentTenant.id,
        platform,
        username,
      },
      transaction,
      model: options.database.member,
      limit: 1,
    })
    if (records.length === 0) {
      return null
    }
    if (doPopulateRelations) {
      return this._populateRelations(records[0], options)
    }
    return records[0].get({ plain: true })
  }

  static async update(id, data, options: IRepositoryOptions, doPopulateRelations = true) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    let record = await options.database.member.findOne({
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
          'displayName',
          'attributes',
          'email',
          'score',
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

    await record.setTasks(data.tasks || [], {
      transaction,
    })

    await record.setNotes(data.notes || [], {
      transaction,
    })

    if (data.organizations) {
      await record.setOrganizations(data.organizations || [], {
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

    return this.findById(record.id, options, true, doPopulateRelations)
  }

  static async destroy(id, options: IRepositoryOptions, force = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.member.findOne({
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

    await options.database.member.destroy({
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
    doPopulateRelations = true,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.member.findOne({
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

    if (doPopulateRelations) {
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

    const records = await options.database.member.findAll({
      attributes: ['id'],
      where,
      transaction,
    })

    return records.map((record) => record.id)
  }

  static async count(filter, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    return options.database.member.count({
      where: {
        ...filter,
        tenantId: tenant.id,
      },
      transaction,
    })
  }

  static async findAndCountAll(
    {
      filter = {} as any,
      advancedFilter = null as any,
      limit = 0,
      offset = 0,
      orderBy = '',
      attributesSettings = [] as AttributeData[],
      exportMode = false,
    },

    options: IRepositoryOptions,
  ) {
    let customOrderBy: Array<any> = []

    const include = [
      {
        model: options.database.memberActivityAggregatesMV,
        attributes: [],
        required: true,
        as: 'memberActivityAggregatesMVs',
      },
      {
        model: options.database.member,
        as: 'toMerge',
        attributes: [],
        through: {
          attributes: [],
        },
      },
      {
        model: options.database.member,
        as: 'noMerge',
        attributes: [],
        through: {
          attributes: [],
        },
      },
    ]

    // get possible platforms for a tenant
    const availableDynamicAttributePlatformKeys = [
      'default',
      'custom',
      ...(await TenantRepository.getAvailablePlatforms(options.currentTenant.id, options)).map(
        (p) => p.platform,
      ),
    ]

    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('activityCount', orderBy),
    )
    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('lastActive', orderBy),
    )

    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('averageSentiment', orderBy),
    )

    if (orderBy.includes('reach')) {
      customOrderBy = customOrderBy.concat([
        Sequelize.literal(`("member".reach->'total')::int`),
        orderBy.split('_')[1],
      ])
    }

    if (!advancedFilter) {
      advancedFilter = { and: [] }

      if (filter) {
        if (filter.id) {
          advancedFilter.and.push({ id: filter.id })
        }

        if (filter.platform) {
          advancedFilter.and.push({
            platform: {
              jsonContains: filter.platform,
            },
          })
        }

        if (filter.tags) {
          advancedFilter.and.push({
            tags: filter.tags,
          })
        }

        if (filter.organizations) {
          advancedFilter.and.push({
            organizations: filter.organizations,
          })
        }

        if (filter.username) {
          advancedFilter.and.push({ username: { jsonContains: filter.username } })
        }

        if (filter.displayName) {
          advancedFilter.and.push({
            displayName: {
              textContains: filter.displayName,
            },
          })
        }

        if (filter.email) {
          advancedFilter.and.push({
            email: {
              textContains: filter.email,
            },
          })
        }

        if (filter.scoreRange) {
          const [start, end] = filter.scoreRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              score: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              score: {
                lte: end,
              },
            })
          }
        }

        if (filter.createdAtRange) {
          const [start, end] = filter.createdAtRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              createdAt: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              createdAt: {
                lte: end,
              },
            })
          }
        }

        if (filter.reachRange) {
          const [start, end] = filter.reachRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              reach: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              reach: {
                lte: end,
              },
            })
          }
        }

        if (filter.activityCountRange) {
          const [start, end] = filter.activityCountRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              activityCount: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              activityCount: {
                lte: end,
              },
            })
          }
        }

        if (filter.joinedAtRange) {
          const [start, end] = filter.joinedAtRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              joinedAt: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              joinedAt: {
                lte: end,
              },
            })
          }
        }

        if (filter.lastActiveRange) {
          const [start, end] = filter.lastActiveRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              lastActive: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              lastActive: {
                lte: end,
              },
            })
          }
        }

        if (filter.averageSentimentRange) {
          const [start, end] = filter.averageSentimentRange
          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              averageSentiment: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              averageSentiment: {
                lte: end,
              },
            })
          }
        }
      }
    }

    const dynamicAttributesNestedFields = attributesSettings.reduce((acc, attribute) => {
      acc[attribute.name] = `attributes.${attribute.name}.default`
      return acc
    }, {})

    const dynamicAttributesLiterals = attributesSettings.reduce((acc, attribute) => {
      for (const key of availableDynamicAttributePlatformKeys) {
        if (attribute.type === AttributeType.NUMBER) {
          acc[`attributes.${attribute.name}.${key}`] = Sequelize.literal(
            `("member"."attributes"#>>'{${attribute.name},${key}}')::integer`,
          )
        } else if (attribute.type === AttributeType.BOOLEAN) {
          acc[`attributes.${attribute.name}.${key}`] = Sequelize.literal(
            `("member"."attributes"#>>'{${attribute.name},${key}}')::boolean`,
          )
        } else {
          acc[`attributes.${attribute.name}.${key}`] = Sequelize.literal(
            `"member"."attributes"#>>'{${attribute.name},${key}}'`,
          )
        }
      }
      return acc
    }, {})

    const dynamicAttributesProjection = attributesSettings.reduce((acc, attribute) => {
      for (const key of availableDynamicAttributePlatformKeys) {
        if (key === 'default') {
          acc.push([
            Sequelize.literal(`"member"."attributes"#>>'{${attribute.name},default}'`),
            attribute.name,
          ])
        } else {
          acc.push([
            Sequelize.literal(`"member"."attributes"#>>'{${attribute.name},${key}}'`),
            `${attribute.name}.${key}`,
          ])
        }
      }
      return acc
    }, [])

    const activityCount = Sequelize.literal(`"memberActivityAggregatesMVs"."activityCount"`)
    const lastActive = Sequelize.literal(`"memberActivityAggregatesMVs"."lastActive"`)
    const activeOn = Sequelize.literal(`"memberActivityAggregatesMVs"."activeOn"`)
    const averageSentiment = Sequelize.literal(`"memberActivityAggregatesMVs"."averageSentiment"`)
    const identities = Sequelize.literal(`ARRAY(SELECT jsonb_object_keys("member"."username"))`)

    const toMergeArray = Sequelize.literal(`STRING_AGG( distinct "toMerge"."id"::text, ',')`)

    const noMergeArray = Sequelize.literal(`STRING_AGG( distinct "noMerge"."id"::text, ',')`)

    const parser = new QueryParser(
      {
        nestedFields: {
          ...dynamicAttributesNestedFields,
          reach: 'reach.total',
        },
        aggregators: {
          activityCount,
          lastActive,
          averageSentiment,
          activeOn,
          identities,
          ...dynamicAttributesLiterals,
          'reach.total': Sequelize.literal(`("member".reach->'total')::int`),
          ...SequelizeFilterUtils.getNativeTableFieldAggregations(
            [
              'id',
              'username',
              'attributes',
              'displayName',
              'email',
              'score',
              'joinedAt',
              'importHash',
              'reach',
              'createdAt',
              'updatedAt',
              'createdById',
              'updatedById',
            ],
            'member',
          ),
        },
        manyToMany: {
          tags: {
            table: 'members',
            model: 'member',
            relationTable: {
              name: 'memberTags',
              from: 'memberId',
              to: 'tagId',
            },
          },
          organizations: {
            table: 'members',
            model: 'member',
            relationTable: {
              name: 'memberOrganizations',
              from: 'memberId',
              to: 'organizationId',
            },
          },
        },
        customOperators: {
          username: {
            model: 'member',
            column: 'username',
          },
          platform: {
            model: 'member',
            column: 'username',
          },
        },
        exportMode,
      },
      options,
    )

    const parsed: QueryOutput = parser.parse({
      filter: advancedFilter,
      orderBy: orderBy || ['joinedAt_DESC'],
      limit,
      offset,
    })

    let order = parsed.order

    if (customOrderBy.length > 0) {
      order = [customOrderBy]
    }

    let {
      rows,
      count, // eslint-disable-line prefer-const
    } = await options.database.member.findAndCountAll({
      where: parsed.where ? parsed.where : {},
      having: parsed.having ? parsed.having : {},
      include,
      attributes: [
        ...SequelizeFilterUtils.getLiteralProjections(
          [
            'id',
            'username',
            'attributes',
            'displayName',
            'email',
            'tenantId',
            'score',
            'joinedAt',
            'importHash',
            'createdAt',
            'updatedAt',
            'createdById',
            'updatedById',
            'reach',
          ],
          'member',
        ),
        [activeOn, 'activeOn'],
        [identities, 'identities'],
        [activityCount, 'activityCount'],
        [lastActive, 'lastActive'],
        [averageSentiment, 'averageSentiment'],
        [toMergeArray, 'toMergeIds'],
        [noMergeArray, 'noMergeIds'],
        ...dynamicAttributesProjection,
      ],
      limit: parsed.limit || 50,
      offset: offset ? Number(offset) : 0,
      order,
      subQuery: false,
      group: [
        'member.id',
        'memberActivityAggregatesMVs.activeOn',
        'memberActivityAggregatesMVs.activityCount',
        'memberActivityAggregatesMVs.lastActive',
        'memberActivityAggregatesMVs.averageSentiment',
        'toMerge.id',
      ],
      distinct: true,
    })

    rows = await this._populateRelationsForRows(rows, attributesSettings, exportMode)

    return {
      rows,
      count: count.length,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    }
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
            displayName: {
              [Op.iLike]: `${query}%`,
            },
          },
        ],
      })
    }

    const where = { [Op.and]: whereAnd }

    const records = await options.database.member.findAll({
      attributes: ['id', 'displayName'],
      where,
      limit: limit ? Number(limit) : undefined,
      order: [['displayName', 'ASC']],
    })

    return records.map((record) => ({
      id: record.id,
      label: record.displayName,
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
          entityName: 'member',
          entityId: record.id,
          action,
          values,
        },
        options,
      )
    }
  }

  static async _populateRelationsForRows(rows, attributesSettings, exportMode = false) {
    if (!rows) {
      return rows
    }

    // No need for lazyloading tags for integrations or microservices
    if (
      (KUBE_MODE &&
        (SERVICE === ServiceType.NODEJS_WORKER || SERVICE === ServiceType.JOB_GENERATOR) && !exportMode) ||
      process.env.SERVICE === 'integrations' ||
      process.env.SERVICE === 'microservices-nodejs'
    ) {
      return rows.map((record) => {
        const plainRecord = record.get({ plain: true })
        plainRecord.noMerge = plainRecord.noMergeIds ? plainRecord.noMergeIds.split(',') : []
        plainRecord.toMerge = plainRecord.toMergeIds ? plainRecord.toMergeIds.split(',') : []

        delete plainRecord.toMergeIds
        delete plainRecord.noMergeIds
        return plainRecord
      })
    }

    return Promise.all(
      rows.map(async (record) => {
        const plainRecord = record.get({ plain: true })
        plainRecord.noMerge = plainRecord.noMergeIds ? plainRecord.noMergeIds.split(',') : []
        plainRecord.toMerge = plainRecord.toMergeIds ? plainRecord.toMergeIds.split(',') : []
        plainRecord.lastActivity = plainRecord.lastActive
          ? (
              await record.getActivities({
                order: [['timestamp', 'DESC']],
                limit: 1,
              })
            )[0].get({ plain: true })
          : null
        delete plainRecord.toMergeIds
        delete plainRecord.noMergeIds

        plainRecord.activeOn = plainRecord.activeOn ?? []

        for (const attribute of attributesSettings) {
          if (Object.prototype.hasOwnProperty.call(plainRecord, attribute.name)) {
            delete plainRecord[attribute.name]
          }
        }

        delete plainRecord.company
        plainRecord.organizations = await record.getOrganizations({
          joinTableAttributes: [],
        })
        plainRecord.tags = await record.getTags({
          joinTableAttributes: [],
        })

        if (exportMode) {
          plainRecord.notes = await record.getNotes({
            joinTableAttributes: [],
          })
        }
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

    output.lastActivity = output.activities[0]?.get({ plain: true }) ?? null

    output.lastActive = output.activities[0]?.timestamp ?? null

    output.activeOn = [...new Set(output.activities.map((i) => i.platform))]

    output.identities = Object.keys(output.username)

    output.activityCount = output.activities.length

    output.averageSentiment =
      output.activityCount > 0
        ? Math.round(
            (output.activities.reduce((acc, i) => {
              if ('sentiment' in i.sentiment) {
                acc += i.sentiment.sentiment
              }
              return acc
            }, 0) /
              output.activities.filter((i) => 'sentiment' in i.sentiment).length) *
              100,
          ) / 100
        : 0

    output.tags = await record.getTags({
      transaction,
      joinTableAttributes: [],
    })

    output.organizations = await record.getOrganizations({
      transaction,
      joinTableAttributes: [],
    })

    output.tasks = await record.getTasks({
      transaction,
      joinTableAttributes: [],
    })

    output.notes = await record.getNotes({
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

export default MemberRepository
