import lodash from 'lodash'
import Sequelize, { QueryTypes } from 'sequelize'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import Error404 from '../../errors/Error404'
import { IRepositoryOptions } from './IRepositoryOptions'
import QueryParser from './filters/queryParser'
import { QueryOutput } from './filters/queryTypes'

const { Op } = Sequelize

class OrganizationRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.organization.create(
      {
        ...lodash.pick(data, [
          'name',
          'url',
          'description',
          'parentUrl',
          'emails',
          'phoneNumbers',
          'logo',
          'tags',
          'website',
          'location',
          'github',
          'twitter',
          'linkedin',
          'crunchbase',
          'employees',
          'revenueRange',
          'importHash',
          'isTeamOrganization',
        ]),

        tenantId: tenant.id,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await record.setMembers(data.members || [], {
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async update(id, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    let record = await options.database.organization.findOne({
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
          'name',
          'url',
          'description',
          'parentUrl',
          'emails',
          'phoneNumbers',
          'logo',
          'tags',
          'website',
          'location',
          'github',
          'twitter',
          'linkedin',
          'crunchbase',
          'employees',
          'revenueRange',
          'importHash',
          'isTeamOrganization',
        ]),
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )
    if (data.members) {
      await record.setMembers(data.members || [], {
        transaction,
      })
    }

    if (
      data.isTeamOrganization === true ||
      data.isTeamOrganization === 'true' ||
      data.isTeamOrganization === false ||
      data.isTeamOrganization === 'false'
    ) {
      await this.setOrganizationIsTeam(record.id, data.isTeamOrganization, options)
    }

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options)
  }

  /**
   * Marks/unmarks an organization's members as team members
   * @param organizationId
   * @param isTeam
   * @param options
   */
  static async setOrganizationIsTeam(
    organizationId: string,
    isTeam: boolean,
    options: IRepositoryOptions,
  ): Promise<void> {
    await options.database.sequelize.query(
      `update members as m
      set attributes = jsonb_set("attributes", '{isTeamMember}', '{"default": ${isTeam}}'::jsonb)
      from "memberOrganizations" as mo
      where mo."memberId" = m.id
      and mo."organizationId" = :organizationId
      and m."tenantId" = :tenantId;
   `,
      {
        replacements: {
          isTeam,
          organizationId,
          tenantId: options.currentTenant.id,
        },
        type: QueryTypes.UPDATE,
      },
    )
  }

  static async destroy(id, options: IRepositoryOptions, force = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.organization.findOne({
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
      transaction,
      force,
    })

    await this._createAuditLog(AuditLogRepository.DELETE, record, record, options)
  }

  static async findById(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.organization.findOne({
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

    return this._populateRelations(record, options)
  }

  static async findByName(name, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.organization.findOne({
      where: {
        name,
        tenantId: currentTenant.id,
      },
      include,
      transaction,
    })

    if (!record) {
      return null
    }

    return record.get({ plain: true })
  }

  static async findByUrl(url, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.organization.findOne({
      where: {
        url,
        tenantId: currentTenant.id,
      },
      include,
      transaction,
    })

    if (!record) {
      return null
    }

    return record.get({ plain: true })
  }

  static async filterIdInTenant(id, options: IRepositoryOptions) {
    return lodash.get(await this.filterIdsInTenant([id], options), '[0]', null)
  }

  static async filterIdsInTenant(ids, options: IRepositoryOptions) {
    if (!ids || !ids.length) {
      return []
    }

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const where = {
      id: {
        [Op.in]: ids,
      },
      tenantId: currentTenant.id,
    }

    const records = await options.database.organization.findAll({
      attributes: ['id'],
      where,
    })

    return records.map((record) => record.id)
  }

  static async destroyBulk(ids, options: IRepositoryOptions, force = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    await options.database.organization.destroy({
      where: {
        id: ids,
        tenantId: currentTenant.id,
      },
      force,
      transaction,
    })
  }

  static async count(filter, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    return options.database.organization.count({
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
      includeOrganizationsWithoutMembers = false,
    },
    options: IRepositoryOptions,
  ) {
    let customOrderBy: Array<any> = []

    const include = [
      {
        model: options.database.member,
        as: 'members',
        required: !includeOrganizationsWithoutMembers,
        attributes: [],
        through: {
          attributes: [],
        },
        include: [
          {
            model: options.database.activity,
            as: 'activities',
            attributes: [],
          },
        ],
      },
    ]

    const activeOn = Sequelize.literal(
      `array_agg( distinct  ("members->activities".platform) )  filter (where "members->activities".platform is not null)`,
    )

    const identities = Sequelize.literal(
      `array( select distinct jsonb_object_keys(jsonb_array_elements(jsonb_agg( case when "members".username is not null then "members".username else '{}' end))))`,
    )

    const lastActive = Sequelize.literal(`MAX("members->activities".timestamp)`)

    const joinedAt = Sequelize.literal(`MIN("members->activities".timestamp)`)

    const memberCount = Sequelize.literal(`COUNT(DISTINCT "members".id)::integer`)

    const activityCount = Sequelize.literal(`COUNT("members->activities".id)::integer`)

    // If the advanced filter is empty, we construct it from the query parameter filter
    if (!advancedFilter) {
      advancedFilter = { and: [] }

      if (filter.id) {
        advancedFilter.and.push({
          id: filter.id,
        })
      }

      if (filter.name) {
        advancedFilter.and.push({
          name: {
            textContains: filter.name,
          },
        })
      }

      if (filter.url) {
        advancedFilter.and.push({
          url: {
            textContains: filter.url,
          },
        })
      }

      if (filter.description) {
        advancedFilter.and.push({
          description: {
            textContains: filter.description,
          },
        })
      }

      if (filter.emails) {
        if (typeof filter.emails === 'string') {
          filter.emails = filter.emails.split(',')
        }
        advancedFilter.and.push({
          emails: {
            overlap: filter.emails,
          },
        })
      }

      if (filter.phoneNumbers) {
        if (typeof filter.phoneNumbers === 'string') {
          filter.phoneNumbers = filter.phoneNumbers.split(',')
        }
        advancedFilter.and.push({
          phoneNumbers: {
            overlap: filter.phoneNumbers,
          },
        })
      }

      if (filter.tags) {
        if (typeof filter.tags === 'string') {
          filter.tags = filter.tags.split(',')
        }
        advancedFilter.and.push({
          tags: {
            overlap: filter.tags,
          },
        })
      }

      if (filter.twitter) {
        advancedFilter.and.push({
          twitter: {
            textContains: filter.twitter,
          },
        })
      }

      if (filter.linkedin) {
        advancedFilter.and.push({
          linkedin: {
            textContains: filter.linkedin,
          },
        })
      }

      if (filter.crunchbase) {
        advancedFilter.and.push({
          crunchbase: {
            textContains: filter.crunchbase,
          },
        })
      }

      if (filter.employeesRange) {
        const [start, end] = filter.employeesRange

        if (start !== undefined && start !== null && start !== '') {
          advancedFilter.and.push({
            employees: {
              gte: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          advancedFilter.and.push({
            employees: {
              lte: end,
            },
          })
        }
      }

      if (filter.revenueMin) {
        advancedFilter.and.push({
          revenueMin: {
            gte: filter.revenueMin,
          },
        })
      }

      if (filter.revenueMax) {
        advancedFilter.and.push({
          revenueMax: {
            lte: filter.revenueMax,
          },
        })
      }

      if (filter.parentUrl) {
        advancedFilter.and.push({
          parentUrl: {
            textContains: filter.parentUrl,
          },
        })
      }

      if (filter.members) {
        advancedFilter.and.push({
          members: filter.members,
        })
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
    }

    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('lastActive', orderBy),
    )
    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('joinedAt', orderBy),
    )
    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('activityCount', orderBy),
    )

    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('memberCount', orderBy),
    )

    const parser = new QueryParser(
      {
        nestedFields: {
          twitter: 'twitter.handle',
          linkedin: 'linkedin.handle',
          crunchbase: 'crunchbase.handle',
          revenueMin: 'revenueRange.min',
          revenueMax: 'revenueRange.max',
          revenue: 'revenueRange.min',
        },
        aggregators: {
          ...SequelizeFilterUtils.getNativeTableFieldAggregations(
            [
              'id',
              'name',
              'url',
              'description',
              'parentUrl',
              'emails',
              'phoneNumbers',
              'logo',
              'tags',
              'website',
              'location',
              'github',
              'twitter',
              'linkedin',
              'crunchbase',
              'employees',
              'revenueRange',
              'importHash',
              'createdAt',
              'updatedAt',
              'deletedAt',
              'tenantId',
              'createdById',
              'updatedById',
              'isTeamOrganization',
            ],
            'organization',
          ),
          activeOn,
          identities,
          lastActive,
          joinedAt,
          memberCount,
          activityCount,
        },
        manyToMany: {
          members: {
            table: 'organizations',
            model: 'organization',
            relationTable: {
              name: 'memberOrganizations',
              from: 'organizationId',
              to: 'memberId',
            },
          },
        },
      },
      options,
    )

    const parsed: QueryOutput = parser.parse({
      filter: advancedFilter,
      orderBy: orderBy || ['createdAt_DESC'],
      limit,
      offset,
    })

    let order = parsed.order

    if (customOrderBy.length > 0) {
      order = [customOrderBy]
    } else if (orderBy) {
      order = [orderBy.split('_')]
    }

    let {
      rows,
      count, // eslint-disable-line prefer-const
    } = await options.database.organization.findAndCountAll({
      ...(parsed.where ? { where: parsed.where } : {}),
      ...(parsed.having ? { having: parsed.having } : {}),
      attributes: [
        ...SequelizeFilterUtils.getLiteralProjections(
          [
            'id',
            'name',
            'url',
            'description',
            'parentUrl',
            'emails',
            'phoneNumbers',
            'logo',
            'tags',
            'website',
            'location',
            'github',
            'twitter',
            'linkedin',
            'crunchbase',
            'employees',
            'revenueRange',
            'importHash',
            'createdAt',
            'updatedAt',
            'deletedAt',
            'tenantId',
            'createdById',
            'updatedById',
            'isTeamOrganization',
          ],
          'organization',
        ),
        [activeOn, 'activeOn'],
        [identities, 'identities'],
        [lastActive, 'lastActive'],
        [joinedAt, 'joinedAt'],
        [memberCount, 'memberCount'],
        [activityCount, 'activityCount'],
      ],
      order,
      limit: parsed.limit,
      offset: parsed.offset,
      include,
      subQuery: false,
      group: ['organization.id'],
      transaction: SequelizeRepository.getTransaction(options),
    })

    rows = await this._populateRelationsForRows(rows)

    return { rows, count: count.length, limit: parsed.limit, offset: parsed.offset }
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
          { id: SequelizeFilterUtils.uuid(query) },
          {
            [Op.and]: SequelizeFilterUtils.ilikeIncludes('organization', 'name', query),
          },
        ],
      })
    }

    const where = { [Op.and]: whereAnd }

    const records = await options.database.organization.findAll({
      attributes: ['id', 'name'],
      where,
      limit: limit ? Number(limit) : undefined,
      order: [['name', 'ASC']],
    })

    return records.map((record) => ({
      id: record.id,
      label: record.name,
    }))
  }

  static async _createAuditLog(action, record, data, options: IRepositoryOptions) {
    let values = {}

    if (data) {
      values = {
        ...record.get({ plain: true }),
        memberIds: data.members,
      }
    }

    await AuditLogRepository.log(
      {
        entityName: 'organization',
        entityId: record.id,
        action,
        values,
      },
      options,
    )
  }

  static async _populateRelationsForRows(rows) {
    if (!rows) {
      return rows
    }

    return rows.map((record) => {
      const rec = record.get({ plain: true })
      rec.activeOn = rec.activeOn ?? []
      return rec
    })
  }

  static async _populateRelations(record, options: IRepositoryOptions) {
    if (!record) {
      return record
    }

    const output = record.get({ plain: true })

    delete output.organizationCacheId

    const transaction = SequelizeRepository.getTransaction(options)

    const members = await record.getMembers({
      include: ['activities'],
      transaction,
    })

    output.activeOn = [
      ...new Set(
        members
          .reduce((acc, m) => acc.concat(...m.get({ plain: true }).activities), [])
          .map((a) => a.platform),
      ),
    ]

    const activityTimestamps = members
      .reduce((acc, m) => acc.concat(...m.get({ plain: true }).activities), [])
      .map((i) => i.timestamp)

    output.lastActive =
      activityTimestamps.length > 0 ? new Date(Math.max(...activityTimestamps)) : null

    output.joinedAt =
      activityTimestamps.length > 0 ? new Date(Math.min(...activityTimestamps)) : null

    output.identities = [
      ...new Set(
        members.reduce((acc, m) => acc.concat(...Object.keys(m.get({ plain: true }).username)), []),
      ),
    ]

    output.memberCount = members.length

    output.activityCount = activityTimestamps.length

    return output
  }
}

export default OrganizationRepository
