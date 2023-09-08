import lodash from 'lodash'
import { FieldTranslatorFactory, OpensearchQueryParser } from '@crowd/opensearch'
import { PageData } from '@crowd/common'
import { IOrganization, IOrganizationIdentity, OpenSearchIndex, SyncStatus } from '@crowd/types'
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
    with org_activities as (select a."organizationId", count(a.id) as "orgActivityCount"
                            from activities a
                            where a."tenantId" = :tenantId and
                                  a."deletedAt" is null and
                                  a."isContribution" = true
                            group by a."organizationId"
                            having count(id) > 0)
    select org.id
        , cach.id "cachId"
        , org."name"
        , org."displayName"
        , org."location"
        , org."website"
        , org."lastEnrichedAt"
        , org."twitter"
        , org."employees"
        , org."size"
        , org."founded"
        , org."industry"
        , org."naics"
        , org."profiles"
        , org."headline"
        , org."ticker"
        , org."type"
        , org."address"
        , org."geoLocation"
        , org."employeeCountByCountry"
        , org."twitter"
        , org."linkedin"
        , org."linkedin"
        , org."crunchbase"
        , org."github"
        , org."description"
        , org."revenueRange"
        , org."tags"
        , org."affiliatedProfiles"
        , org."allSubsidiaries"
        , org."alternativeDomains"
        , org."alternativeNames"
        , org."averageEmployeeTenure"
        , org."averageTenureByLevel"
        , org."averageTenureByRole"
        , org."directSubsidiaries"
        , org."employeeChurnRate"
        , org."employeeCountByMonth"
        , org."employeeGrowthRate"
        , org."employeeCountByMonthByLevel"
        , org."employeeCountByMonthByRole"
        , org."gicsSector"
        , org."grossAdditionsByMonth"
        , org."grossDeparturesByMonth"
        , org."ultimateParent"
        , org."immediateParent"
        , activity."orgActivityCount"
    from "organizations" as org
            join "organizationCaches" cach on org."name" = cach."name"
            join org_activities activity on activity."organizationId" = org."id"
    where :tenantId = org."tenantId"
      and (org."lastEnrichedAt" is null or date_part('month', age(now(), org."lastEnrichedAt")) >= 6)
    order by org."lastEnrichedAt" asc, org."website", activity."orgActivityCount" desc, org."createdAt" desc
    limit :limit;
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
          'displayName',
          'description',
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
          'manuallyCreated',
          'affiliatedProfiles',
          'allSubsidiaries',
          'alternativeDomains',
          'alternativeNames',
          'averageEmployeeTenure',
          'averageTenureByLevel',
          'averageTenureByRole',
          'directSubsidiaries',
          'employeeChurnRate',
          'employeeCountByMonth',
          'employeeGrowthRate',
          'employeeCountByMonthByLevel',
          'employeeCountByMonthByRole',
          'gicsSector',
          'grossAdditionsByMonth',
          'grossDeparturesByMonth',
          'ultimateParent',
          'immediateParent',
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
    isEnrichment: boolean = false,
  ): Promise<T> {
    // Ensure every organization has a non-undefine primary ID
    const isValid = new Set(data.filter((org) => org.id).map((org) => org.id)).size !== data.length
    if (isValid) return [] as T

    if (isEnrichment) {
      // Fetch existing organizations
      const existingOrgs = await options.database.organization.findAll({
        where: {
          id: {
            [options.database.Sequelize.Op.in]: data.map((org) => org.id),
          },
        },
      })

      // Append new tags to existing tags instead of overwriting
      if (fields.includes('tags')) {
        // @ts-ignore
        data = data.map((org) => {
          const existingOrg = existingOrgs.find((o) => o.id === org.id)
          if (existingOrg && existingOrg.tags) {
            // Merge existing and new tags without duplicates
            org.tags = lodash.uniq([...existingOrg.tags, ...org.tags])
          }
          return org
        })
      }
    }
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
          'displayName',
          'description',
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
          'affiliatedProfiles',
          'allSubsidiaries',
          'alternativeDomains',
          'alternativeNames',
          'averageEmployeeTenure',
          'averageTenureByLevel',
          'averageTenureByRole',
          'directSubsidiaries',
          'employeeChurnRate',
          'employeeCountByMonth',
          'employeeGrowthRate',
          'employeeCountByMonthByLevel',
          'employeeCountByMonthByRole',
          'gicsSector',
          'grossAdditionsByMonth',
          'grossDeparturesByMonth',
          'ultimateParent',
          'immediateParent',
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
      and mo."deletedAt" is null
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

  static async addIdentity(
    organizationId: string,
    identity: IOrganizationIdentity,
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const query = `
          insert into 
              "organizationIdentities"("organizationId", "platform", "name", "url", "sourceId", "tenantId", "integrationId", "createdAt")
          values 
              (:organizationId, :platform, :name, :url, :sourceId, :tenantId, :integrationId, now())
          on conflict do nothing;
    `

    await sequelize.query(query, {
      replacements: {
        organizationId,
        platform: identity.platform,
        sourceId: identity.sourceId || null,
        url: identity.url || null,
        tenantId: currentTenant.id,
        integrationId: identity.integrationId || null,
        name: identity.name,
      },
      type: QueryTypes.INSERT,
      transaction,
    })
  }

  static async getIdentities(
    organizationId: string,
    options: IRepositoryOptions,
  ): Promise<IOrganizationIdentity[]> {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const results = await sequelize.query(
      `
      select "sourceId", "platform", "name", "integrationId" from "organizationIdentities"
      where "organizationId" = :organizationId and "tenantId" = :tenantId
    `,
      {
        replacements: {
          organizationId,
          tenantId: currentTenant.id,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return results as IOrganizationIdentity[]
  }

  static async findByIdentity(
    segmentId: string,
    identity: IOrganizationIdentity,
    options: IRepositoryOptions,
  ): Promise<IOrganization> {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const results = await sequelize.query(
      `
      with
          "organizationsWithIdentity" as (
              select os."organizationId"
              from "organizationSegments" os
              join "organizationIdentities" oi on os."organizationId" = oi."organizationId"
              where 
                    os."segmentId" = :segmentId
                    and oi.platform = :platform
                    and oi.name = :name
          )
          select o.id,
                  o.description,
                  o.emails,
                  o.logo,
                  o.tags,
                  o.github,
                  o.twitter,
                  o.linkedin,
                  o.crunchbase,
                  o.employees,
                  o.location,
                  o.website,
                  o.type,
                  o.size,
                  o.headline,
                  o.industry,
                  o.founded,
                  o.attributes
          from organizations o
          where o."tenantId" = :tenantId
          and o.id in (select "organizationId" from "organizationsWithIdentity");
      `,
      {
        replacements: {
          segmentId,
          tenantId: currentTenant.id,
          name: identity.name,
          platform: identity.platform,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    if (results.length === 0) {
      return null
    }

    const result = results[0] as IOrganization

    return result
  }

  static async findById(id: string, options: IRepositoryOptions, segmentId?: string) {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const replacements: Record<string, unknown> = {
      id,
      tenantId: currentTenant.id,
    }

    // query for all leaf segment ids
    let segmentsSubQuery = `
    select id
    from segments
    where "tenantId" = :tenantId and "parentSlug" is not null and "grandparentSlug" is not null
    `

    if (segmentId) {
      // we load data for a specific segment (can be leaf, parent or grand parent id)
      replacements.segmentId = segmentId
      segmentsSubQuery = `
      with input_segment as (select id,
                                    slug,
                                    "parentSlug",
                                    "grandparentSlug"
                            from segments
                            where id = :segmentId
                              and "tenantId" = :tenantId),
                            segment_level as (select case
                                        when "parentSlug" is not null and "grandparentSlug" is not null
                                            then 'child'
                                        when "parentSlug" is not null and "grandparentSlug" is null
                                            then 'parent'
                                        when "parentSlug" is null and "grandparentSlug" is null
                                            then 'grandparent'
                                        end as level,
                                    id,
                                    slug,
                                    "parentSlug",
                                    "grandparentSlug"
                            from input_segment)
                            select s.id
                            from segments s
                            join
                            segment_level sl
                            on
                            (sl.level = 'child' and s.id = sl.id) or
                            (sl.level = 'parent' and s."parentSlug" = sl.slug and s."grandparentSlug" is not null) or
                            (sl.level = 'grandparent' and s."grandparentSlug" = sl.slug)`
    }

    const query = `
    with leaf_segment_ids as (${segmentsSubQuery}),
    member_data as (select a."organizationId",
        count(distinct m.id) filter ( where mo."dateEnd" is null )                  as "memberCount",
        count(distinct a.id)                                                        as "activityCount",
        case
            when array_agg(distinct a.platform) = array [null] then array []::text[]
            else array_agg(distinct a.platform) end                                 as "activeOn",
        max(a.timestamp)                                                            as "lastActive",
        min(a.timestamp) filter ( where a.timestamp <> '1970-01-01T00:00:00.000Z' ) as "joinedAt"
    from leaf_segment_ids ls
          left join activities a
                    on a."segmentId" = ls.id and a."organizationId" = :id and
                      a."deletedAt" is null
          left join members m on a."memberId" = m.id and m."deletedAt" is null
          left join "memberOrganizations" mo
                    on m.id = mo."memberId" and mo."organizationId" = :id
          left join "memberIdentities" mi on m.id = mi."memberId"
    group by a."organizationId"),
    organization_segments as (select "organizationId", array_agg("segmentId") as "segments"
          from "organizationSegments"
          where "organizationId" = :id
          group by "organizationId"),
    identities as (
      SELECT oi."organizationId", jsonb_agg(oi) AS "identities"
      FROM "organizationIdentities" oi
      WHERE oi."organizationId" = :id
      GROUP BY "organizationId"
    )
    select 
      o.*,
      coalesce(md."activityCount", 0)::integer as "activityCount",
      coalesce(md."memberCount", 0)::integer   as "memberCount",
      coalesce(md."activeOn", '{}')            as "activeOn",
      coalesce(i.identities, '{}')            as identities,
      coalesce(os.segments, '{}')              as segments,
      md."lastActive",
      md."joinedAt"
    from organizations o
    left join member_data md on md."organizationId" = o.id
    left join organization_segments os on os."organizationId" = o.id
    left join identities i on i."organizationId" = o.id
    where o.id = :id
    and o."tenantId" = :tenantId;
`

    const results = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
      transaction,
    })

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

  static async findByDomain(domain, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    // Check if organization exists
    const organization = await options.database.organization.findOne({
      where: {
        website: {
          [Sequelize.Op.or]: [
            // Matches URLs having 'http://' or 'https://'
            { [Sequelize.Op.iLike]: `%://${domain}` },
            // Matches URLs having 'www'
            { [Sequelize.Op.iLike]: `%://www.${domain}` },
            // Matches URLs that doesn't have 'http://' or 'https://' and 'www'
            { [Sequelize.Op.iLike]: `${domain}` },
          ],
        },
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (!organization) {
      return null
    }

    return organization.get({ plain: true })
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

    if (filter.and) {
      filter.and.push({
        or: [
          {
            manuallyCreated: {
              eq: true,
            },
          },
          {
            activityCount: {
              gt: 0,
            },
          },
        ],
      })
    }

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
          where: {
            deletedAt: null,
          },
        },
        include: [
          {
            model: options.database.activity,
            as: 'activities',
            attributes: [],
          },
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

    const activeOn = Sequelize.literal(
      `array_agg( distinct  ("members->activities".platform) )  filter (where "members->activities".platform is not null)`,
    )

    // TODO: member identitites FIX
    const identities = Sequelize.literal(
      `array_agg( distinct "members->memberIdentities".platform)`,
    )

    const lastActive = Sequelize.literal(`MAX("members->activities".timestamp)`)

    const joinedAt = Sequelize.literal(`
        MIN(
          CASE
            WHEN "members->activities".timestamp != '1970-01-01T00:00:00.000Z'
            THEN "members->activities".timestamp
          END
        )
      `)

    const memberCount = Sequelize.literal(`COUNT(DISTINCT "members".id)::integer`)

    const activityCount = Sequelize.literal(`COUNT("members->activities".id)::integer`)

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
              'manuallyCreated',
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
            'manuallyCreated',
            'affiliatedProfiles',
            'allSubsidiaries',
            'alternativeDomains',
            'alternativeNames',
            'averageEmployeeTenure',
            'averageTenureByLevel',
            'averageTenureByRole',
            'directSubsidiaries',
            'employeeChurnRate',
            'employeeCountByMonth',
            'employeeGrowthRate',
            'employeeCountByMonthByLevel',
            'employeeCountByMonthByRole',
            'gicsSector',
            'grossAdditionsByMonth',
            'grossDeparturesByMonth',
            'ultimateParent',
            'immediateParent',
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
