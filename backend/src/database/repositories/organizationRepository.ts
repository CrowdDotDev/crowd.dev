import lodash from 'lodash'
import { FieldTranslatorFactory, OpensearchQueryParser } from '@crowd/opensearch'
import { PageData } from '@crowd/common'
import { OpenSearchIndex, SyncStatus } from '@crowd/types'
import Sequelize, { QueryTypes } from 'sequelize'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import Error404 from '../../errors/Error404'
import { IRepositoryOptions } from './IRepositoryOptions'
import QueryParser from './filters/queryParser'
import { QueryOutput } from './filters/queryTypes'
import OrganizationSyncRemoteRepository from './organizationSyncRemoteRepository'
import isFeatureEnabled from '@/feature-flags/isFeatureEnabled'
import { FeatureFlag } from '@/types/common'

const { Op } = Sequelize

class OrganizationRepository {
  static async filterByPayingTenant<T extends object>(
    tenantId: string,
    limit: number,
    options: IRepositoryOptions,
  ): Promise<T[]> {
    const database = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)
    const query = `
      with orgActivities as (
        SELECT memOrgs."organizationId", SUM(actAgg."activityCount") "orgActivityCount"
        FROM "memberActivityAggregatesMVs" actAgg
        INNER JOIN "memberOrganizations" memOrgs ON actAgg."id"=memOrgs."memberId"
        GROUP BY memOrgs."organizationId"
      ) 
      SELECT org.id "id"
      ,cach.id "cachId"
      ,org."name"
      ,org."displayName"
      ,org."location"
      ,org."website"
      ,org."lastEnrichedAt"
      ,org."twitter"
      ,org."employees"
      ,org."size"
      ,org."founded"
      ,org."industry"
      ,org."naics"
      ,org."profiles"
      ,org."headline"
      ,org."ticker"
      ,org."type"
      ,org."address"
      ,org."geoLocation"
      ,org."employeeCountByCountry"
      ,org."twitter"
      ,org."linkedin"
      ,org."linkedin"
      ,org."crunchbase"
      ,org."github"
      ,org."description"
      FROM "organizations" as org
      JOIN "organizationCaches" cach ON org."name" = cach."name"
      JOIN orgActivities activity ON activity."organizationId" = org."id"
      WHERE :tenantId = org."tenantId" AND (org."lastEnrichedAt" IS NULL OR DATE_PART('month', AGE(NOW(), org."lastEnrichedAt")) >= 6)
      ORDER BY org."lastEnrichedAt" ASC, org."website", activity."orgActivityCount" DESC, org."createdAt" DESC
      LIMIT :limit
    ;
    `
    const orgs: T[] = await database.query(query, {
      type: QueryTypes.SELECT,
      transaction,
      replacements: {
        tenantId,
        limit,
      },
    })
    return orgs
  }

  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    if (!data.displayName) {
      data.displayName = data.name
    }

    const record = await options.database.organization.create(
      {
        ...lodash.pick(data, [
          'name',
          'displayName',
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
          'employeeCountByCountry',
          'type',
          'ticker',
          'headline',
          'profiles',
          'naics',
          'industry',
          'founded',
          'size',
          'lastEnrichedAt',
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

    await OrganizationRepository.includeOrganizationToSegments(record.id, options)

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async bulkUpdate<T extends any[]>(
    data: T,
    fields: string[],
    options: IRepositoryOptions,
  ): Promise<T> {
    // Ensure every organization has a non-undefine primary ID
    const isValid = new Set(data.filter((org) => org.id).map((org) => org.id)).size !== data.length
    if (isValid) return [] as T

    // Using bulk insert to update on duplicate primary ID
    const orgs = await options.database.organization.bulkCreate(data, {
      fields: ['id', 'tenantId', ...fields],
      updateOnDuplicate: fields,
      returning: fields,
    })
    return orgs
  }

  static async includeOrganizationToSegments(organizationId: string, options: IRepositoryOptions) {
    const seq = SequelizeRepository.getSequelize(options)

    const transaction = SequelizeRepository.getTransaction(options)

    let bulkInsertOrganizationSegments = `INSERT INTO "organizationSegments" ("organizationId","segmentId", "tenantId", "createdAt") VALUES `
    const replacements = {
      organizationId,
      tenantId: options.currentTenant.id,
    }

    for (let idx = 0; idx < options.currentSegments.length; idx++) {
      bulkInsertOrganizationSegments += ` (:organizationId, :segmentId${idx}, :tenantId, now()) `

      replacements[`segmentId${idx}`] = options.currentSegments[idx].id

      if (idx !== options.currentSegments.length - 1) {
        bulkInsertOrganizationSegments += `,`
      }
    }

    bulkInsertOrganizationSegments += ` ON CONFLICT DO NOTHING`

    await seq.query(bulkInsertOrganizationSegments, {
      replacements,
      type: QueryTypes.INSERT,
      transaction,
    })
  }

  static async excludeOrganizationsFromSegments(
    organizationIds: string[],
    options: IRepositoryOptions,
  ) {
    const seq = SequelizeRepository.getSequelize(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const bulkDeleteOrganizationSegments = `DELETE FROM "organizationSegments" WHERE "organizationId" in (:organizationIds) and "segmentId" in (:segmentIds);`

    await seq.query(bulkDeleteOrganizationSegments, {
      replacements: {
        organizationIds,
        segmentIds: SequelizeRepository.getSegmentIds(options),
      },
      type: QueryTypes.DELETE,
      transaction,
    })
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

    // exclude syncRemote attributes, since these are populated from organizationSyncRemote table
    if (data.attributes?.syncRemote) {
      delete data.attributes.syncRemote
    }

    record = await record.update(
      {
        ...lodash.pick(data, [
          'name',
          'displayName',
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
          'employeeCountByCountry',
          'type',
          'ticker',
          'headline',
          'profiles',
          'naics',
          'industry',
          'founded',
          'size',
          'employees',
          'twitter',
          'lastEnrichedAt',
          'attributes',
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

    if (data.segments) {
      await OrganizationRepository.includeOrganizationToSegments(record.id, {
        ...options,
        transaction,
      })
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

    await OrganizationRepository.excludeOrganizationsFromSegments([id], {
      ...options,
      transaction,
    })
    const org = await this.findById(id, options)

    if (org.segments.length === 0) {
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
  }

  static async findById(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const results = await sequelize.query(
      `
          WITH
              activity_counts AS (
                  SELECT mo."organizationId", COUNT(a.id) AS "activityCount"
                  FROM "memberOrganizations" mo
                  LEFT JOIN activities a ON a."memberId" = mo."memberId"
                  WHERE mo."organizationId" = :id
                  GROUP BY mo."organizationId"
              ),
              member_counts AS (
                  SELECT "organizationId", COUNT(DISTINCT "memberId") AS "memberCount"
                  FROM "memberOrganizations"
                  WHERE "organizationId" = :id
                  GROUP BY "organizationId"
              ),
              active_on AS (
                  SELECT mo."organizationId", ARRAY_AGG(DISTINCT platform) AS "activeOn"
                  FROM "memberOrganizations" mo
                  JOIN activities a ON a."memberId" = mo."memberId"
                  WHERE mo."organizationId" = :id
                  GROUP BY mo."organizationId"
              ),
              identities AS (
                  SELECT "organizationId", ARRAY_AGG(DISTINCT platform) AS "identities"
                  FROM "memberOrganizations" mo
                  JOIN "memberIdentities" mi ON mi."memberId" = mo."memberId"
                  WHERE mo."organizationId" = :id
                  GROUP BY "organizationId"
              ),
              last_active AS (
                  SELECT mo."organizationId", MAX(timestamp) AS "lastActive", MIN(timestamp) AS "joinedAt"
                  FROM "memberOrganizations" mo
                  JOIN activities a ON a."memberId" = mo."memberId"
                  WHERE mo."organizationId" = :id
                  GROUP BY mo."organizationId"
              ),
              segments AS (
                  SELECT "organizationId", ARRAY_AGG("segmentId") AS "segments"
                  FROM "organizationSegments"
                  WHERE "organizationId" = :id
                  GROUP BY "organizationId"
              )
          SELECT
              o.*,
              COALESCE(ac."activityCount", 0)::INTEGER AS "activityCount",
              COALESCE(mc."memberCount", 0)::INTEGER AS "memberCount",
              COALESCE(ao."activeOn", '{}') AS "activeOn",
              COALESCE(id."identities", '{}') AS "identities",
              COALESCE(s."segments", '{}') AS "segments",
              a."lastActive",
              a."joinedAt"
          FROM organizations o
          LEFT JOIN activity_counts ac ON ac."organizationId" = o.id
          LEFT JOIN member_counts mc ON mc."organizationId" = o.id
          LEFT JOIN active_on ao ON ao."organizationId" = o.id
          LEFT JOIN identities id ON id."organizationId" = o.id
          LEFT JOIN last_active a ON a."organizationId" = o.id
          LEFT JOIN segments s ON s."organizationId" = o.id
          WHERE o.id = :id
            AND o."tenantId" = :tenantId;
      `,
      {
        replacements: {
          id,
          tenantId: currentTenant.id,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    if (results.length === 0) {
      throw new Error404()
    }

    const result = results[0] as any

    const manualSyncRemote = await new OrganizationSyncRemoteRepository({
      ...options,
      transaction,
    }).findOrganizationManualSync(result.id)

    for (const syncRemote of manualSyncRemote) {
      if (result.attributes?.syncRemote) {
        result.attributes.syncRemote[syncRemote.platform] = syncRemote.status === SyncStatus.ACTIVE
      } else {
        result.attributes.syncRemote = {
          [syncRemote.platform]: syncRemote.status === SyncStatus.ACTIVE,
        }
      }
    }

    // compatibility issue
    delete result.searchSyncedAt

    return result
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

    await OrganizationRepository.excludeOrganizationsFromSegments(ids, {
      ...options,
      transaction,
    })

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

  static async findAndCountAllOpensearch(
    {
      filter = {} as any,
      limit = 20,
      offset = 0,
      orderBy = 'joinedAt_DESC',
      countOnly = false,
      segments = [] as string[],
      customSortFunction = undefined,
    },
    options: IRepositoryOptions,
  ): Promise<PageData<any>> {
    if (orderBy.length === 0) {
      orderBy = 'joinedAt_DESC'
    }

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const segmentsEnabled = await isFeatureEnabled(FeatureFlag.SEGMENTS, options)

    const segment = segments[0]

    const translator = FieldTranslatorFactory.getTranslator(OpenSearchIndex.ORGANIZATIONS)

    const parsed = OpensearchQueryParser.parse(
      { filter, limit, offset, orderBy },
      OpenSearchIndex.ORGANIZATIONS,
      translator,
    )

    // add tenant filter to parsed query
    parsed.query.bool.must.push({
      term: {
        uuid_tenantId: tenant.id,
      },
    })

    if (segmentsEnabled) {
      // add segment filter
      parsed.query.bool.must.push({
        term: {
          uuid_segmentId: segment,
        },
      })
    }

    // exclude empty filters if any
    parsed.query.bool.must = parsed.query.bool.must.filter((obj) => {
      // Check if the object has a non-empty 'term' property
      if (obj.term) {
        return Object.keys(obj.term).length !== 0
      }
      return true
    })

    if (customSortFunction) {
      parsed.sort = customSortFunction
    }

    const countResponse = await options.opensearch.count({
      index: OpenSearchIndex.ORGANIZATIONS,
      body: { query: parsed.query },
    })

    if (countOnly) {
      return {
        rows: [],
        count: countResponse.body.count,
        limit,
        offset,
      }
    }

    const response = await options.opensearch.search({
      index: OpenSearchIndex.ORGANIZATIONS,
      body: parsed,
    })

    const translatedRows = response.body.hits.hits.map((o) =>
      translator.translateObjectToCrowd(o._source),
    )

    return { rows: translatedRows, count: countResponse.body.count, limit, offset }
  }

  static async findAndCountAll(
    {
      filter = {} as any,
      advancedFilter = null as any,
      limit = 0,
      offset = 0,
      orderBy = '',
      includeOrganizationsWithoutMembers = true,
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
            model: options.database.memberIdentity,
            as: 'memberIdentities',
            attributes: [],
          },
        ],
      },
      {
        model: options.database.segment,
        as: 'segments',
        attributes: [],
        through: {
          attributes: [],
        },
      },
    ]

    const activeOn = Sequelize.literal(`ARRAY[]::TEXT[]`)

    // TODO: member identitites FIX
    const identities = Sequelize.literal(`ARRAY[]::TEXT[]`)

    const lastActive = Sequelize.literal(`NULL`)

    const joinedAt = Sequelize.literal(`NULL`)

    const memberCount = Sequelize.literal(`COUNT(DISTINCT "members".id)::integer`)

    const activityCount = Sequelize.literal(`NULL`)

    const segments = Sequelize.literal(
      `ARRAY_AGG(DISTINCT "segments->organizationSegments"."segmentId")`,
    )

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

      if (filter.displayName) {
        advancedFilter.and.push({
          displayName: {
            textContains: filter.displayName,
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
              'displayName',
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
              'type',
              'attributes',
            ],
            'organization',
          ),
          activeOn,
          identities,
          lastActive,
          joinedAt,
          memberCount,
          activityCount,
          segments,
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
          segments: {
            table: 'organizations',
            model: 'organization',
            relationTable: {
              name: 'organizationSegments',
              from: 'organizationId',
              to: 'segmentId',
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
            'displayName',
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
            'type',
            'ticker',
            'size',
            'naics',
            'lastEnrichedAt',
            'industry',
            'headline',
            'geoLocation',
            'founded',
            'employeeCountByCountry',
            'address',
            'profiles',
            'attributes',
          ],
          'organization',
        ),
        [activeOn, 'activeOn'],
        [identities, 'identities'],
        [lastActive, 'lastActive'],
        [joinedAt, 'joinedAt'],
        [memberCount, 'memberCount'],
        [activityCount, 'activityCount'],
        [segments, 'segmentIds'],
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
            [Op.and]: SequelizeFilterUtils.ilikeIncludes('organization', 'displayName', query),
          },
        ],
      })
    }

    const where = { [Op.and]: whereAnd }

    const records = await options.database.organization.findAll({
      attributes: ['id', 'displayName', 'logo'],
      where,
      limit: limit ? Number(limit) : undefined,
      order: [['displayName', 'ASC']],
    })

    return records.map((record) => ({
      id: record.id,
      label: record.displayName,
      logo: record.logo,
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
      rec.segments = rec.segmentIds ?? []
      delete rec.segmentIds
      return rec
    })
  }
}

export default OrganizationRepository
