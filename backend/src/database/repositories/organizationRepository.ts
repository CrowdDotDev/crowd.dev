import lodash, { chunk } from 'lodash'
import { get as getLevenshteinDistance } from 'fast-levenshtein'
import validator from 'validator'
import { FieldTranslatorFactory, OpensearchQueryParser } from '@crowd/opensearch'
import { PageData } from '@crowd/common'
import {
  IEnrichableOrganization,
  IMemberOrganization,
  IOrganization,
  IOrganizationIdentity,
  IOrganizationMergeSuggestion,
  OpenSearchIndex,
  SyncStatus,
} from '@crowd/types'
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
import { SegmentData } from '@/types/segmentTypes'
import SegmentRepository from './segmentRepository'

const { Op } = Sequelize

interface IOrganizationIdentityOpensearch {
  string_platform: string
  string_name: string
}

interface IOrganizationPartialAggregatesOpensearch {
  _source: {
    uuid_organizationId: string
    nested_identities: {
      string_platform: string
      string_name: string
    }[]
    uuid_arr_noMergeIds: string[]
  }
}

interface ISimilarOrganization {
  _score: number
  _source: {
    uuid_organizationId: string
    nested_identities: IOrganizationIdentityOpensearch[]
    nested_weakIdentities: IOrganizationIdentityOpensearch[]
  }
}

interface IOrganizationId {
  id: string
}

interface IOrganizationNoMerge {
  organizationId: string
  noMergeId: string
}

class OrganizationRepository {
  static async filterByPayingTenant(
    tenantId: string,
    limit: number,
    options: IRepositoryOptions,
  ): Promise<IEnrichableOrganization[]> {
    const database = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)
    const query = `
    with org_activities as (select a."organizationId", count(a.id) as "orgActivityCount"
                        from activities a
                        where a."tenantId" = :tenantId
                          and a."deletedAt" is null
                          and a."isContribution" = true
                        group by a."organizationId"
                        having count(id) > 0),
     identities as (select oi."organizationId", jsonb_agg(oi) as "identities"
                    from "organizationIdentities" oi
                    where oi."tenantId" = :tenantId
                    group by oi."organizationId")
    select org.id,
          i.identities,
          org."displayName",
          org."location",
          org."website",
          org."lastEnrichedAt",
          org."twitter",
          org."employees",
          org."size",
          org."founded",
          org."industry",
          org."naics",
          org."profiles",
          org."headline",
          org."ticker",
          org."type",
          org."address",
          org."geoLocation",
          org."employeeCountByCountry",
          org."twitter",
          org."linkedin",
          org."crunchbase",
          org."github",
          org."description",
          org."revenueRange",
          org."tags",
          org."affiliatedProfiles",
          org."allSubsidiaries",
          org."alternativeDomains",
          org."alternativeNames",
          org."averageEmployeeTenure",
          org."averageTenureByLevel",
          org."averageTenureByRole",
          org."directSubsidiaries",
          org."employeeChurnRate",
          org."employeeCountByMonth",
          org."employeeGrowthRate",
          org."employeeCountByMonthByLevel",
          org."employeeCountByMonthByRole",
          org."gicsSector",
          org."grossAdditionsByMonth",
          org."grossDeparturesByMonth",
          org."ultimateParent",
          org."immediateParent",
          activity."orgActivityCount"
    from "organizations" as org
            join org_activities activity on activity."organizationId" = org."id"
            join identities i on i."organizationId" = org.id
    where :tenantId = org."tenantId"
      and (org."lastEnrichedAt" is null or date_part('month', age(now(), org."lastEnrichedAt")) >= 6)
    order by org."lastEnrichedAt" asc, org."website", activity."orgActivityCount" desc, org."createdAt" desc
    limit :limit
    `
    const orgs: IEnrichableOrganization[] = await database.query(query, {
      type: QueryTypes.SELECT,
      transaction,
      replacements: {
        tenantId,
        limit,
      },
    })
    return orgs
  }

  static async filterByActiveLastYear(
    tenantId: string,
    limit: number,
    options: IRepositoryOptions,
  ): Promise<IEnrichableOrganization[]> {
    const database = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)
    const query = `
    with org_activities as (select a."organizationId", count(a.id) as "orgActivityCount"
                        from activities a
                        where a."tenantId" = :tenantId
                          and a."deletedAt" is null
                          and a."isContribution" = true
                          and a."createdAt" > (CURRENT_DATE - INTERVAL '1 year')
                        group by a."organizationId"
                        having count(id) > 0),
     identities as (select oi."organizationId", jsonb_agg(oi) as "identities"
                    from "organizationIdentities" oi
                    where oi."tenantId" = :tenantId
                    group by oi."organizationId")
    select org.id,
          i.identities,
          org."displayName",
          org."location",
          org."website",
          org."lastEnrichedAt",
          org."twitter",
          org."employees",
          org."size",
          org."founded",
          org."industry",
          org."naics",
          org."profiles",
          org."headline",
          org."ticker",
          org."type",
          org."address",
          org."geoLocation",
          org."employeeCountByCountry",
          org."twitter",
          org."linkedin",
          org."crunchbase",
          org."github",
          org."description",
          org."revenueRange",
          org."tags",
          org."affiliatedProfiles",
          org."allSubsidiaries",
          org."alternativeDomains",
          org."alternativeNames",
          org."averageEmployeeTenure",
          org."averageTenureByLevel",
          org."averageTenureByRole",
          org."directSubsidiaries",
          org."employeeChurnRate",
          org."employeeCountByMonth",
          org."employeeGrowthRate",
          org."employeeCountByMonthByLevel",
          org."employeeCountByMonthByRole",
          org."gicsSector",
          org."grossAdditionsByMonth",
          org."grossDeparturesByMonth",
          org."ultimateParent",
          org."immediateParent",
          activity."orgActivityCount"
    from "organizations" as org
            join org_activities activity on activity."organizationId" = org."id"
            join identities i on i."organizationId" = org.id
    where :tenantId = org."tenantId"
    order by org."lastEnrichedAt" asc, org."website", activity."orgActivityCount" desc, org."createdAt" desc
    limit :limit
    `
    const orgs: IEnrichableOrganization[] = await database.query(query, {
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
      data.displayName = data.identities[0].name
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

    if (data.identities && data.identities.length > 0) {
      await OrganizationRepository.setIdentities(record.id, data.identities, options)
    }

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
    const transaction = SequelizeRepository.getTransaction(options)

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
    try {
      const orgs = await options.database.organization.bulkCreate(data, {
        fields: ['id', 'tenantId', ...fields],
        updateOnDuplicate: fields,
        returning: fields,
        transaction,
      })
      return orgs
    } catch (error) {
      options.log.error('Error while bulk updating organizations!', error)
      throw error
    }
  }

  static async checkIdentities(
    data: IOrganization,
    options: IRepositoryOptions,
    organizationId?: string,
  ): Promise<void> {
    // convert non-existing weak identities to strong ones
    if (data.weakIdentities && data.weakIdentities.length > 0) {
      const strongNotOwnedIdentities = await OrganizationRepository.findIdentities(
        data.weakIdentities,
        options,
        organizationId,
      )

      const strongIdentities = []

      // find weak identities in the payload that doesn't exist as a strong identity yet
      for (const weakIdentity of data.weakIdentities) {
        if (!strongNotOwnedIdentities.has(`${weakIdentity.platform}:${weakIdentity.name}`)) {
          strongIdentities.push(weakIdentity)
        }
      }

      // exclude identities that are converted to a strong one from weakIdentities
      if (strongIdentities.length > 0) {
        data.weakIdentities = data.weakIdentities.filter(
          (i) =>
            strongIdentities.find((s) => s.platform === i.platform && s.name === i.name) ===
            undefined,
        )
        // push new strong identities to the payload
        for (const identity of strongIdentities) {
          if (
            data.identities.find(
              (i) => i.platform === identity.platform && i.name === identity.name,
            ) === undefined
          ) {
            data.identities.push(identity)
          }
        }
      }
    }

    // convert already existing strong identities to weak ones
    if (data.identities && data.identities.length > 0) {
      const strongNotOwnedIdentities = await OrganizationRepository.findIdentities(
        data.identities,
        options,
        organizationId,
      )

      const weakIdentities: IOrganizationIdentity[] = []

      // find strong identities in payload that already exist in some other organization, and convert these to weak
      for (const identity of data.identities) {
        if (strongNotOwnedIdentities.has(`${identity.platform}:${identity.name}`)) {
          weakIdentities.push(identity)
        }
      }

      // exclude identities that are converted to a weak one from strong identities
      if (weakIdentities.length > 0) {
        data.identities = data.identities.filter(
          (i) =>
            weakIdentities.find((w) => w.platform === i.platform && w.name === i.name) ===
            undefined,
        )

        // push new weak identities to the payload
        for (const weakIdentity of weakIdentities) {
          if (!data.weakIdentities) {
            data.weakIdentities = []
          }

          if (
            data.weakIdentities.find(
              (w) => w.platform === weakIdentity.platform && w.name === weakIdentity.name,
            ) === undefined
          ) {
            data.weakIdentities.push(weakIdentity)
          }
        }
      }
    }
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

  static async removeMemberRole(role: IMemberOrganization, options: IRepositoryOptions) {
    const seq = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)

    let deleteMemberRole = `DELETE FROM "memberOrganizations" 
                                            WHERE 
                                            "organizationId" = :organizationId and 
                                            "memberId" = :memberId`

    const replacements = {
      organizationId: role.organizationId,
      memberId: role.memberId,
    } as any

    if (role.dateStart === null) {
      deleteMemberRole += ` and "dateStart" is null `
    } else {
      deleteMemberRole += ` and "dateStart" = :dateStart `
      replacements.dateStart = (role.dateStart as Date).toISOString()
    }

    if (role.dateEnd === null) {
      deleteMemberRole += ` and "dateEnd" is null `
    } else {
      deleteMemberRole += ` and "dateEnd" = :dateEnd `
      replacements.dateEnd = (role.dateEnd as Date).toISOString()
    }

    await seq.query(deleteMemberRole, {
      replacements,
      type: QueryTypes.DELETE,
      transaction,
    })
  }

  static async addMemberRole(
    role: IMemberOrganization,
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)

    const query = `
          insert into "memberOrganizations" ("memberId", "organizationId", "createdAt", "updatedAt", "title", "dateStart", "dateEnd", "source")
          values (:memberId, :organizationId, NOW(), NOW(), :title, :dateStart, :dateEnd, :source)
          on conflict do nothing;
    `

    await sequelize.query(query, {
      replacements: {
        memberId: role.memberId,
        organizationId: role.organizationId,
        title: role.title || null,
        dateStart: role.dateStart,
        dateEnd: role.dateEnd,
        source: role.source || null,
      },
      type: QueryTypes.INSERT,
      transaction,
    })
  }

  static async update(id, data, options: IRepositoryOptions, overrideIdentities = false) {
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
          'weakIdentities',
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
      await OrganizationRepository.includeOrganizationToSegments(record.id, options)
    }

    if (data.identities && data.identities.length > 0) {
      if (overrideIdentities) {
          await this.setIdentities(id, data.identities, options)
      }
      else {
        for (const identity of data.identities) {
          await this.addIdentity(id, identity, options)
        }
      }
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
    const transaction = SequelizeRepository.getTransaction(options)

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
        transaction,
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

  static async setIdentities(
    organizationId: string,
    identities: IOrganizationIdentity[],
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    await sequelize.query(
      `delete from "organizationIdentities" where "organizationId" = :organizationId and "tenantId" = :tenantId`,
      {
        replacements: {
          organizationId,
          tenantId: currentTenant.id,
        },
        type: QueryTypes.DELETE,
        transaction,
      },
    )

    for (const identity of identities) {
      await OrganizationRepository.addIdentity(organizationId, identity, options)
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
    organizationIds: string[],
    options: IRepositoryOptions,
  ): Promise<IOrganizationIdentity[]> {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const results = await sequelize.query(
      `
      select "sourceId", "platform", "name", "integrationId", "organizationId" from "organizationIdentities"
      where "tenantId" = :tenantId and "organizationId" in (:organizationIds) 
    `,
      {
        replacements: {
          organizationIds,
          tenantId: currentTenant.id,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return results as IOrganizationIdentity[]
  }

  static async moveIdentitiesBetweenOrganizations(
    fromOrganizationId: string,
    toOrganizationId: string,
    identitiesToMove: IOrganizationIdentity[],
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)

    const seq = SequelizeRepository.getSequelize(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const query = `
      update "organizationIdentities" 
      set 
        "organizationId" = :newOrganizationId
      where 
        "tenantId" = :tenantId and 
        "organizationId" = :oldOrganizationId and 
        platform = :platform and 
        name = :name;
    `

    for (const identity of identitiesToMove) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, count] = await seq.query(query, {
        replacements: {
          tenantId: tenant.id,
          oldOrganizationId: fromOrganizationId,
          newOrganizationId: toOrganizationId,
          platform: identity.platform,
          name: identity.name,
        },
        type: QueryTypes.UPDATE,
        transaction,
      })

      if (count !== 1) {
        throw new Error('One row should be updated!')
      }
    }
  }

  static async addNoMerge(
    organizationId: string,
    noMergeId: string,
    options: IRepositoryOptions,
  ): Promise<void> {
    const seq = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)

    const query = `
    insert into "organizationNoMerge" ("organizationId", "noMergeId", "createdAt", "updatedAt")
    values 
    (:organizationId, :noMergeId, now(), now()),
    (:noMergeId, :organizationId, now(), now())
    on conflict do nothing;
  `

    try {
      await seq.query(query, {
        replacements: {
          organizationId,
          noMergeId,
        },
        type: QueryTypes.INSERT,
        transaction,
      })
    } catch (error) {
      options.log.error('Error adding organizations no merge!', error)
      throw error
    }
  }

  static async removeToMerge(
    organizationId: string,
    toMergeId: string,
    options: IRepositoryOptions,
  ): Promise<void> {
    const seq = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)

    const query = `
    delete from "organizationToMerge"
    where ("organizationId" = :organizationId and "toMergeId" = :toMergeId) or ("organizationId" = :toMergeId and "toMergeId" = :organizationId);
  `

    try {
      await seq.query(query, {
        replacements: {
          organizationId,
          toMergeId,
        },
        type: QueryTypes.DELETE,
        transaction,
      })
    } catch (error) {
      options.log.error('Error while removing organizations to merge!', error)
      throw error
    }
  }

  static async findNonExistingIds(ids: string[], options: IRepositoryOptions): Promise<string[]> {
    const transaction = SequelizeRepository.getTransaction(options)
    const seq = SequelizeRepository.getSequelize(options)

    let idValues = ``

    for (let i = 0; i < ids.length; i++) {
      idValues += `('${ids[i]}'::uuid)`

      if (i !== ids.length - 1) {
        idValues += ','
      }
    }

    const query = `WITH id_list (id) AS (
      VALUES
          ${idValues}
        )
        SELECT id
        FROM id_list
        WHERE NOT EXISTS (
            SELECT 1
            FROM organizations o
            WHERE o.id = id_list.id
        );`

    try {
      const results: IOrganizationId[] = await seq.query(query, {
        type: QueryTypes.SELECT,
        transaction,
      })

      return results.map((r) => r.id)
    } catch (error) {
      options.log.error('error while getting non existing organizations from db', error)
      throw error
    }
  }

  static async findNoMergeIds(id: string, options: IRepositoryOptions): Promise<string[]> {
    const transaction = SequelizeRepository.getTransaction(options)
    const seq = SequelizeRepository.getSequelize(options)

    const query = `select onm."organizationId", onm."noMergeId" from "organizationNoMerge" onm
                  where onm."organizationId" = :id or onm."noMergeId" = :id;`

    try {
      const results: IOrganizationNoMerge[] = await seq.query(query, {
        type: QueryTypes.SELECT,
        replacements: {
          id,
        },
        transaction,
      })

      return Array.from(
        results.reduce((acc, r) => {
          if (id === r.organizationId) {
            acc.add(r.noMergeId)
          } else if (id === r.noMergeId) {
            acc.add(r.organizationId)
          }
          return acc
        }, new Set<string>()),
      )
    } catch (error) {
      options.log.error('error while getting non existing organizations from db', error)
      throw error
    }
  }

  static async addToMerge(
    suggestions: IOrganizationMergeSuggestion[],
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)
    const seq = SequelizeRepository.getSequelize(options)

    // Remove possible duplicates
    suggestions = lodash.uniqWith(suggestions, (a, b) =>
      lodash.isEqual(lodash.sortBy(a.organizations), lodash.sortBy(b.organizations)),
    )

    // check all suggestion ids exists in the db
    const uniqueOrganizationIds = Array.from(
      suggestions.reduce((acc, suggestion) => {
        acc.add(suggestion.organizations[0])
        acc.add(suggestion.organizations[1])
        return acc
      }, new Set<string>()),
    )

    // filter non existing org ids from suggestions
    const nonExistingIds = await OrganizationRepository.findNonExistingIds(
      uniqueOrganizationIds,
      options,
    )

    suggestions = suggestions.filter(
      (s) =>
        !nonExistingIds.includes(s.organizations[0]) &&
        !nonExistingIds.includes(s.organizations[1]),
    )

    // Process suggestions in chunks of 100 or less
    const suggestionChunks: IOrganizationMergeSuggestion[][] = chunk(suggestions, 100)

    const insertValues = (
      organizationId: string,
      toMergeId: string,
      similarity: number | null,
      index: number,
    ) => {
      const idPlaceholder = (key: string) => `${key}${index}`
      return {
        query: `(:${idPlaceholder('organizationId')}, :${idPlaceholder(
          'toMergeId',
        )}, :${idPlaceholder('similarity')}, NOW(), NOW())`,
        replacements: {
          [idPlaceholder('organizationId')]: organizationId,
          [idPlaceholder('toMergeId')]: toMergeId,
          [idPlaceholder('similarity')]: similarity === null ? null : similarity,
        },
      }
    }

    for (const suggestionChunk of suggestionChunks) {
      const placeholders: string[] = []
      let replacements: Record<string, unknown> = {}

      suggestionChunk.forEach((suggestion, index) => {
        const { query, replacements: chunkReplacements } = insertValues(
          suggestion.organizations[0],
          suggestion.organizations[1],
          suggestion.similarity,
          index,
        )
        placeholders.push(query)
        replacements = { ...replacements, ...chunkReplacements }
      })

      const query = `
        INSERT INTO "organizationToMerge" ("organizationId", "toMergeId", "similarity", "createdAt", "updatedAt")
        VALUES ${placeholders.join(', ')}
        on conflict do nothing;
      `
      try {
        await seq.query(query, {
          replacements,
          type: QueryTypes.INSERT,
          transaction,
        })
      } catch (error) {
        options.log.error('error adding organizations to merge', error)
        throw error
      }
    }
  }

  static async findMembersBelongToBothOrganizations(
    organizationId1: string,
    organizationId2: string,
    options: IRepositoryOptions,
  ): Promise<IMemberOrganization[]> {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)

    const results = await sequelize.query(
      `
      SELECT  mo.*
      FROM "memberOrganizations" AS mo
      WHERE mo."deletedAt" is null and
         mo."memberId" IN (
          SELECT "memberId"
          FROM "memberOrganizations"
          WHERE "organizationId" = :organizationId1
      )
      AND mo."memberId" IN (
          SELECT "memberId"
          FROM "memberOrganizations"
          WHERE "organizationId" = :organizationId2);
    `,
      {
        replacements: {
          organizationId1,
          organizationId2,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return results as IMemberOrganization[]
  }

  static async moveActivitiesBetweenOrganizations(
    fromOrganizationId: string,
    toOrganizationId: string,
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)

    const seq = SequelizeRepository.getSequelize(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const query = `
      update "activities" 
      set 
        "organizationId" = :newOrganizationId
      where 
        "tenantId" = :tenantId and 
        "organizationId" = :oldOrganizationId 
    `

    await seq.query(query, {
      replacements: {
        tenantId: tenant.id,
        oldOrganizationId: fromOrganizationId,
        newOrganizationId: toOrganizationId,
      },
      type: QueryTypes.UPDATE,
      transaction,
    })
  }

  static async *getMergeSuggestions(
    options: IRepositoryOptions,
  ): AsyncGenerator<IOrganizationMergeSuggestion[], void, undefined> {
    const BATCH_SIZE = 100

    const YIELD_CHUNK_SIZE = 100

    let yieldChunk: IOrganizationMergeSuggestion[] = []

    const prefixLength = (string: string) => {
      if (string.length > 5 && string.length < 8) {
        return 6
      }

      return 10
    }

    const calculateSimilarity = (
      primaryOrganization: IOrganizationPartialAggregatesOpensearch,
      similarOrganization: ISimilarOrganization,
    ): number => {
      let smallestEditDistance: number = null

      let similarPrimaryIdentity: IOrganizationIdentityOpensearch = null

      // find the smallest edit distance between both identity arrays
      for (const primaryIdentity of primaryOrganization._source.nested_identities) {
        // similar organization has a weakIdentity as one of primary organization's strong identity, return score 95
        if (
          similarOrganization._source.nested_weakIdentities.length > 0 &&
          similarOrganization._source.nested_weakIdentities.some(
            (weakIdentity) =>
              weakIdentity.string_name === primaryIdentity.string_name &&
              weakIdentity.string_platform === primaryIdentity.string_platform,
          )
        ) {
          return 0.95
        }
        for (const secondaryIdentity of similarOrganization._source.nested_identities) {
          const currentLevenstheinDistance = getLevenshteinDistance(
            primaryIdentity.string_name,
            secondaryIdentity.string_name,
          )
          if (smallestEditDistance === null || smallestEditDistance > currentLevenstheinDistance) {
            smallestEditDistance = currentLevenstheinDistance
            similarPrimaryIdentity = primaryIdentity
          }
        }
      }

      // calculate similarity percentage
      const identityLength = similarPrimaryIdentity.string_name.length

      if (identityLength < smallestEditDistance) {
        // if levensthein distance is bigger than the word itself, it might be a prefix match, return medium similarity
        return (Math.floor(Math.random() * 21) + 20) / 100
      }

      return Math.floor(((identityLength - smallestEditDistance) / identityLength) * 100) / 100
    }

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const queryBody = {
      from: 0,
      size: BATCH_SIZE,
      query: {},
      sort: {
        [`uuid_organizationId`]: 'asc',
      },
      collapse: {
        field: 'uuid_organizationId',
      },
      _source: ['uuid_organizationId', 'nested_identities', 'uuid_arr_noMergeIds'],
    }

    let organizations: IOrganizationPartialAggregatesOpensearch[] = []
    let lastUuid: string

    do {
      if (organizations.length > 0) {
        queryBody.query = {
          bool: {
            filter: [
              {
                bool: {
                  should: [
                    {
                      range: {
                        int_activityCount: {
                          gt: 0,
                        },
                      },
                    },
                    {
                      term: {
                        bool_manuallyCreated: true,
                      },
                    },
                  ],
                  minimum_should_match: 1,
                },
              },
              {
                term: {
                  uuid_tenantId: tenant.id,
                },
              },
              {
                range: {
                  uuid_organizationId: {
                    gt: lastUuid,
                  },
                },
              },
            ],
          },
        }
      } else {
        queryBody.query = {
          bool: {
            filter: [
              {
                bool: {
                  should: [
                    {
                      range: {
                        int_activityCount: {
                          gt: 0,
                        },
                      },
                    },
                    {
                      term: {
                        bool_manuallyCreated: true,
                      },
                    },
                  ],
                  minimum_should_match: 1,
                },
              },
              {
                term: {
                  uuid_tenantId: tenant.id,
                },
              },
            ],
          },
        }
      }

      organizations =
        (
          await options.opensearch.search({
            index: OpenSearchIndex.ORGANIZATIONS,
            body: queryBody,
          })
        ).body?.hits?.hits || []

      if (organizations.length > 0) {
        lastUuid = organizations[organizations.length - 1]._source.uuid_organizationId
      }

      for (const organization of organizations) {
        if (
          organization._source.nested_identities &&
          organization._source.nested_identities.length > 0
        ) {
          const identitiesPartialQuery = {
            should: [
              {
                nested: {
                  path: 'nested_weakIdentities',
                  query: {
                    bool: {
                      should: [],
                      boost: 1000,
                      minimum_should_match: 1,
                    },
                  },
                },
              },
              {
                nested: {
                  path: 'nested_identities',
                  query: {
                    bool: {
                      should: [],
                      boost: 1,
                      minimum_should_match: 1,
                    },
                  },
                },
              },
            ],
            minimum_should_match: 1,
            must_not: [
              {
                term: {
                  uuid_organizationId: organization._source.uuid_organizationId,
                },
              },
            ],
            must: [
              {
                term: {
                  uuid_tenantId: tenant.id,
                },
              },
              {
                bool: {
                  should: [
                    {
                      range: {
                        int_activityCount: {
                          gt: 0,
                        },
                      },
                    },
                    {
                      term: {
                        bool_manuallyCreated: true,
                      },
                    },
                  ],
                  minimum_should_match: 1,
                },
              },
            ],
          }

          let hasFuzzySearch = false

          for (const identity of organization._source.nested_identities) {
            if (identity.string_name.length > 0) {
              // weak identity search
              identitiesPartialQuery.should[0].nested.query.bool.should.push({
                bool: {
                  must: [
                    { match: { [`nested_weakIdentities.keyword_name`]: identity.string_name } },
                    {
                      match: {
                        [`nested_weakIdentities.string_platform`]: identity.string_platform,
                      },
                    },
                  ],
                },
              })

              // some identities have https? in the beginning, resulting in false positive suggestions
              // remove these when making fuzzy, wildcard and prefix searches
              const cleanedIdentityName = identity.string_name.replace(/^https?:\/\//, '')

              // only do fuzzy/wildcard/partial search when identity name is not all numbers (like linkedin organization profiles)
              if (Number.isNaN(Number(identity.string_name))) {
                hasFuzzySearch = true
                // fuzzy search for identities
                identitiesPartialQuery.should[1].nested.query.bool.should.push({
                  match: {
                    [`nested_identities.keyword_name`]: {
                      query: cleanedIdentityName,
                      prefix_length: 1,
                      fuzziness: 'auto',
                    },
                  },
                })

                // also check for prefix for identities that has more than 5 characters and no whitespace
                if (identity.string_name.length > 5 && identity.string_name.indexOf(' ') === -1) {
                  identitiesPartialQuery.should[1].nested.query.bool.should.push({
                    prefix: {
                      [`nested_identities.keyword_name`]: {
                        value: cleanedIdentityName.slice(0, prefixLength(cleanedIdentityName)),
                      },
                    },
                  })
                }
              }
            }
          }

          // check if we have any actual identity searches, if not remove it from the query
          if (!hasFuzzySearch) {
            identitiesPartialQuery.should.pop()
          }

          const noMergeIds = await OrganizationRepository.findNoMergeIds(
            organization._source.uuid_organizationId,
            options,
          )

          if (noMergeIds && noMergeIds.length > 0) {
            for (const noMergeId of noMergeIds) {
              identitiesPartialQuery.must_not.push({
                term: {
                  uuid_organizationId: noMergeId,
                },
              })
            }
          }

          const sameOrganizationsQueryBody = {
            query: {
              bool: identitiesPartialQuery,
            },
            collapse: {
              field: 'uuid_organizationId',
            },
            _source: ['uuid_organizationId', 'nested_identities', 'nested_weakIdentities'],
          }

          const organizationsToMerge: ISimilarOrganization[] =
            (
              await options.opensearch.search({
                index: OpenSearchIndex.ORGANIZATIONS,
                body: sameOrganizationsQueryBody,
              })
            ).body?.hits?.hits || []

          /*
          const { maxScore, minScore } = organizationsToMerge.reduce<MinMaxScores>(
            (acc, organizationToMerge) => {
              if (!acc.minScore || organizationToMerge._score < acc.minScore) {
                acc.minScore = organizationToMerge._score
              }

              if (!acc.maxScore || organizationToMerge._score > acc.maxScore) {
                acc.maxScore = organizationToMerge._score
              }

              return acc
            },
            { maxScore: null, minScore: null },
          )
          */

          for (const organizationToMerge of organizationsToMerge) {
            yieldChunk.push({
              similarity: calculateSimilarity(organization, organizationToMerge),
              organizations: [
                organization._source.uuid_organizationId,
                organizationToMerge._source.uuid_organizationId,
              ],
            })
          }

          if (yieldChunk.length >= YIELD_CHUNK_SIZE) {
            yield yieldChunk
            yieldChunk = []
          }
        }
      }
    } while (organizations.length > 0)

    if (yieldChunk.length > 0) {
      yield yieldChunk
    }
  }

  static async findOrganizationsWithMergeSuggestions(
    { limit = 20, offset = 0 },
    options: IRepositoryOptions,
  ) {
    const currentTenant = SequelizeRepository.getCurrentTenant(options)
    const segmentIds = SequelizeRepository.getSegmentIds(options)

    const orgs = await options.database.sequelize.query(
      `WITH
      cte AS (
        SELECT
          Greatest(Hashtext(Concat(org.id, otm."toMergeId")), Hashtext(Concat(otm."toMergeId", org.id))) as hash,
          org.id,
          otm."toMergeId",
          org."createdAt",
          otm."similarity"
        FROM organizations org
        JOIN "organizationToMerge" otm ON org.id = otm."organizationId"
        JOIN "organizationSegments" os ON os."organizationId" = org.id
        JOIN "organizationSegments" to_merge_segments on to_merge_segments."organizationId" = otm."toMergeId"
        WHERE org."tenantId" = :tenantId
          AND os."segmentId" IN (:segmentIds)
          AND to_merge_segments."segmentId" IN (:segmentIds)
      ),
      
      count_cte AS (
        SELECT COUNT(DISTINCT hash) AS total_count
        FROM cte
      ),
      
      final_select AS (
        SELECT DISTINCT ON (hash)
          id,
          "toMergeId",
          "createdAt",
          "similarity"
        FROM cte
        ORDER BY hash, id
      )
      
      SELECT
        "organizationsToMerge".id,
        "organizationsToMerge"."toMergeId",
        count_cte."total_count",
        "organizationsToMerge"."similarity"
      FROM
        final_select AS "organizationsToMerge",
        count_cte
      ORDER BY
        "organizationsToMerge"."similarity" DESC, "organizationsToMerge".id
      LIMIT :limit OFFSET :offset
    `,
      {
        replacements: {
          tenantId: currentTenant.id,
          segmentIds,
          limit,
          offset,
        },
        type: QueryTypes.SELECT,
      },
    )

    if (orgs.length > 0) {
      const organizationPromises = []
      const toMergePromises = []

      for (const org of orgs) {
        organizationPromises.push(OrganizationRepository.findById(org.id, options))
        toMergePromises.push(OrganizationRepository.findById(org.toMergeId, options))
      }

      const organizationResults = await Promise.all(organizationPromises)
      const organizationToMergeResults = await Promise.all(toMergePromises)

      const result = organizationResults.map((i, idx) => ({
        organizations: [i, organizationToMergeResults[idx]],
        similarity: orgs[idx].similarity,
      }))
      return { rows: result, count: orgs[0].total_count, limit, offset }
    }

    return { rows: [{ organizations: [], similarity: 0 }], count: 0, limit, offset }
  }

  static async moveMembersBetweenOrganizations(
    fromOrganizationId: string,
    toOrganizationId: string,
    options: IRepositoryOptions,
  ): Promise<void> {
    const seq = SequelizeRepository.getSequelize(options)

    const transaction = SequelizeRepository.getTransaction(options)

    let removeRoles: IMemberOrganization[] = []

    let addRoles: IMemberOrganization[] = []

    // first, handle members that belong to both organizations,
    // then make a full update on remaining org2 members (that doesn't belong to o1)
    const memberRolesWithBothOrganizations = await this.findMembersBelongToBothOrganizations(
      fromOrganizationId,
      toOrganizationId,
      options,
    )

    const primaryOrganizationMemberRoles = memberRolesWithBothOrganizations.filter(
      (m) => m.organizationId === toOrganizationId,
    )
    const secondaryOrganizationMemberRoles = memberRolesWithBothOrganizations.filter(
      (m) => m.organizationId === fromOrganizationId,
    )

    for (const memberOrganization of secondaryOrganizationMemberRoles) {
      // if dateEnd and dateStart isn't available, we don't need to move but delete it from org2
      if (memberOrganization.dateStart === null && memberOrganization.dateEnd === null) {
        removeRoles.push(memberOrganization)
      }
      // it's a current role, also check org1 to see which one starts earlier
      else if (memberOrganization.dateStart !== null && memberOrganization.dateEnd === null) {
        const currentRoles = primaryOrganizationMemberRoles.filter(
          (mo) =>
            mo.memberId === memberOrganization.memberId &&
            mo.dateStart !== null &&
            mo.dateEnd === null,
        )
        if (currentRoles.length === 0) {
          // no current role in org1, add the memberOrganization to org1
          addRoles.push(memberOrganization)
        } else if (currentRoles.length === 1) {
          const currentRole = currentRoles[0]
          if (new Date(memberOrganization.dateStart) <= new Date(currentRoles[0].dateStart)) {
            // add a new role with earlier dateStart
            addRoles.push({
              id: currentRole.id,
              dateStart: (memberOrganization.dateStart as Date).toISOString(),
              dateEnd: null,
              memberId: currentRole.memberId,
              organizationId: currentRole.organizationId,
              title: currentRole.title,
              source: currentRole.source,
            })

            // remove current role
            removeRoles.push(currentRole)
          }

          // delete role from org2
          removeRoles.push(memberOrganization)
        } else {
          throw new Error(`Member ${memberOrganization.memberId} has more than one current roles.`)
        }
      } else if (memberOrganization.dateStart === null && memberOrganization.dateEnd !== null) {
        throw new Error(`Member organization with dateEnd and without dateStart!`)
      } else {
        // both dateStart and dateEnd exists
        const foundIntersectingRoles = primaryOrganizationMemberRoles.filter((mo) => {
          const primaryStart = new Date(mo.dateStart)
          const primaryEnd = new Date(mo.dateEnd)
          const secondaryStart = new Date(memberOrganization.dateStart)
          const secondaryEnd = new Date(memberOrganization.dateEnd)

          return (
            mo.memberId === memberOrganization.memberId &&
            ((secondaryStart < primaryStart && secondaryEnd > primaryStart) ||
              (primaryStart < secondaryStart && secondaryEnd < primaryEnd) ||
              (secondaryStart < primaryStart && secondaryEnd > primaryEnd) ||
              (primaryStart < secondaryStart && secondaryEnd > primaryEnd))
          )
        })

        // rebuild dateRanges using intersecting roles coming from primary and secondary organizations
        const startDates = [...foundIntersectingRoles, memberOrganization].map((org) =>
          new Date(org.dateStart).getTime(),
        )
        const endDates = [...foundIntersectingRoles, memberOrganization].map((org) =>
          new Date(org.dateEnd).getTime(),
        )

        addRoles.push({
          dateStart: new Date(Math.min.apply(null, startDates)).toISOString(),
          dateEnd: new Date(Math.max.apply(null, endDates)).toISOString(),
          memberId: memberOrganization.memberId,
          organizationId: toOrganizationId,
          title:
            foundIntersectingRoles.length > 0
              ? foundIntersectingRoles[0].title
              : memberOrganization.title,
          source:
            foundIntersectingRoles.length > 0
              ? foundIntersectingRoles[0].source
              : memberOrganization.source,
        })

        // we'll delete all roles that intersect with incoming org member roles and create a merged role
        for (const r of foundIntersectingRoles) {
          removeRoles.push(r)
        }
      }

      for (const removeRole of removeRoles) {
        await this.removeMemberRole(removeRole, options)
      }

      for (const addRole of addRoles) {
        await this.addMemberRole(addRole, options)
      }

      addRoles = []
      removeRoles = []
    }

    // update rest of the o2 members
    await seq.query(
      `
      UPDATE "memberOrganizations"
        SET "organizationId" = :toOrganizationId
        WHERE "organizationId" = :fromOrganizationId 
        AND "deletedAt" IS NULL
        AND "memberId" NOT IN (
            SELECT "memberId" 
            FROM "memberOrganizations" 
            WHERE "organizationId" = :toOrganizationId
        );
      `,
      {
        replacements: {
          toOrganizationId,
          fromOrganizationId,
        },
        type: QueryTypes.UPDATE,
        transaction,
      },
    )
  }

  static async getOrganizationSegments(
    organizationId: string,
    options: IRepositoryOptions,
  ): Promise<SegmentData[]> {
    const transaction = SequelizeRepository.getTransaction(options)
    const seq = SequelizeRepository.getSequelize(options)
    const segmentRepository = new SegmentRepository(options)

    const query = `
        SELECT "segmentId"
        FROM "organizationSegments"
        WHERE "organizationId" = :organizationId
        ORDER BY "createdAt";
    `

    const data = await seq.query(query, {
      replacements: {
        organizationId,
      },
      type: QueryTypes.SELECT,
      transaction,
    })

    const segmentIds = (data as any[]).map((item) => item.segmentId)
    const segments = await segmentRepository.findInIds(segmentIds)

    return segments
  }

  static async findByIdentity(
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
              select oi."organizationId"
              from "organizationIdentities" oi
              where 
                    oi.platform = :platform
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

  static async findByDomain(domain: string, options: IRepositoryOptions): Promise<IOrganization> {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const results = await sequelize.query(
      `
      SELECT
      o.id,
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
      o.attributes,
      o."weakIdentities"
    FROM
      organizations o
    WHERE
      o."tenantId" = :tenantId AND 
      o.website = :domain
      `,
      {
        replacements: {
          tenantId: currentTenant.id,
          domain,
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

  static async findIdentities(
    identities: IOrganizationIdentity[],
    options: IRepositoryOptions,
    organizationId?: string,
  ): Promise<Map<string, string>> {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = {
      tenantId: currentTenant.id,
    } as any

    const condition = organizationId ? 'and "organizationId" <> :organizationId' : ''

    if (organizationId) {
      params.organizationId = organizationId
    }

    const identityParams = identities
      .map((identity, index) => `(:platform${index}, :name${index})`)
      .join(', ')

    identities.forEach((identity, index) => {
      params[`platform${index}`] = identity.platform
      params[`name${index}`] = identity.name
    })

    const results = (await sequelize.query(
      `
      with input_identities (platform, name) as (
        values ${identityParams}
      )
      select "organizationId", i.platform, i.name
      from "organizationIdentities" oi
        inner join input_identities i on oi.platform = i.platform and oi.name = i.name
      where oi."tenantId" = :tenantId ${condition}
    `,
      {
        replacements: params,
        type: QueryTypes.SELECT,
        transaction,
      },
    )) as IOrganizationIdentity[]

    const resultMap = new Map<string, string>()
    results.forEach((row) => {
      resultMap.set(`${row.platform}:${row.name}`, row.organizationId)
    })

    return resultMap
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
        count(distinct a."memberId")                                                        as "memberCount",
        count(distinct a.id)                                                        as "activityCount",
        case
            when array_agg(distinct a.platform) = array [null] then array []::text[]
            else array_agg(distinct a.platform) end                                 as "activeOn",
        max(a.timestamp)                                                            as "lastActive",
        min(a.timestamp) filter ( where a.timestamp <> '1970-01-01T00:00:00.000Z' ) as "joinedAt"
    from leaf_segment_ids ls
          join activities a
                    on a."segmentId" = ls.id and a."organizationId" = :id and
                      a."deletedAt" is null
          join "organizationSegments" os on a."segmentId" = os."segmentId" and os."organizationId" = :id
          join members m on a."memberId" = m.id and m."deletedAt" is null
          join "memberOrganizations" mo on m.id = mo."memberId" and mo."organizationId" = :id and mo."dateEnd" is null
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

    const manualSyncRemote = await new OrganizationSyncRemoteRepository(
      options,
    ).findOrganizationManualSync(result.id)

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

  static async findOrCreateByDomain(domain, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    // Check if organization exists
    let organization = await options.database.organization.findOne({
      attributes: ['id'],
      where: {
        website: domain,
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (!organization) {
      const data = {
        displayName: domain,
        website: domain,
        identities: [
          {
            name: domain,
            platform: 'email',
          },
        ],
        tenantId: currentTenant.id,
      }
      organization = await this.create(data, options)
    }

    return organization.id
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

  static async findOrganizationActivities(
    organizationId: string,
    limit: number,
    offset: number,
    options: IRepositoryOptions,
  ): Promise<any[]> {
    const seq = SequelizeRepository.getSequelize(options)

    const results = await seq.query(
      `select "id", "organizationId"
        from "activities"
        where "organizationId" = :organizationId
        order by "createdAt"
        limit :limit offset :offset`,
      {
        replacements: {
          organizationId,
          limit,
          offset,
        },
        type: QueryTypes.SELECT,
      },
    )

    return results
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

      if (filter.displayName) {
        advancedFilter.and.push({
          displayName: {
            textContains: filter.displayName,
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
    const segmentIds = SequelizeRepository.getSegmentIds(options)

    const records = await options.database.sequelize.query(
      `
        SELECT
            DISTINCT
            o."id",
            o."displayName" AS label,
            o."logo",
            o."displayName" ILIKE :queryExact AS exact
        FROM "organizations" AS o
        JOIN "organizationSegments" os ON os."organizationId" = o.id
        WHERE o."deletedAt" IS NULL
          AND o."tenantId" = :tenantId
          AND (o."displayName" ILIKE :queryLike OR o.id = :uuid)
          AND os."segmentId" IN (:segmentIds)
          AND os."tenantId" = :tenantId
        ORDER BY o."displayName" ILIKE :queryExact DESC, o."displayName"
        LIMIT :limit;
      `,
      {
        replacements: {
          limit: limit ? Number(limit) : 20,
          tenantId: tenant.id,
          segmentIds,
          queryLike: `%${query}%`,
          queryExact: query,
          uuid: validator.isUUID(query) ? query : null,
        },
        type: QueryTypes.SELECT,
        raw: true,
      },
    )

    return records
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
