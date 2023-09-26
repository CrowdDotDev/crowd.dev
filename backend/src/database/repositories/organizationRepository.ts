import lodash from 'lodash'
import { FieldTranslatorFactory, OpensearchQueryParser } from '@crowd/opensearch'
import { PageData } from '@crowd/common'
import {
  IEnrichableOrganization,
  IMemberOrganization,
  IOrganization,
  IOrganizationIdentity,
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
    const orgs = await options.database.organization.bulkCreate(data, {
      fields: ['id', 'tenantId', ...fields],
      updateOnDuplicate: fields,
      returning: fields,
      transaction,
    })
    return orgs
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
      await OrganizationRepository.includeOrganizationToSegments(record.id, {
        ...options,
        transaction,
      })
    }

    if (data.identities && data.identities.length > 0) {
      await this.setIdentities(id, data.identities, options)
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
      await this.addIdentity(organizationId, identity, options)
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

  static async findIdentities(
    identities: IOrganizationIdentity[],
    options: IRepositoryOptions,
    organizationId?: string,
  ): Promise<Map<string, string>> {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      tenantId: currentTenant.id,
    }

    let condition = ''
    if (organizationId) {
      condition = 'and "organizationId" <> :organizationId'
      params.organizationId = organizationId
    }

    const identityParams = identities
      .map((identity) => `('${identity.platform.replace(/'/g, "''")}', '${identity.name.replace(/'/g, "''")}')`)
      .join(', ')

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
