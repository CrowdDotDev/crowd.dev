import { Error400, Error404, Error409, PageData, RawQueryParser } from '@crowd/common'
import { FieldTranslatorFactory, OpensearchQueryParser } from '@crowd/opensearch'
import {
  addOrgIdentity,
  cleanUpOrgIdentities,
  fetchOrgIdentities,
} from '@crowd/data-access-layer/src/org_identities'
import {
  FeatureFlag,
  IEnrichableOrganization,
  IMemberRenderFriendlyRole,
  IMemberRoleWithOrganization,
  IOrganization,
  IOrganizationIdentity,
  IOrganizationMergeSuggestion,
  MergeActionState,
  MergeActionType,
  OpenSearchIndex,
  SegmentData,
  SegmentProjectGroupNestedData,
  SegmentProjectNestedData,
  SyncStatus,
} from '@crowd/types'
import lodash, { chunk } from 'lodash'
import Sequelize, { QueryTypes } from 'sequelize'
import {
  captureApiChange,
  organizationCreateAction,
  organizationEditIdentitiesAction,
  organizationUpdateAction,
} from '@crowd/audit-logs'
import validator from 'validator'
import { getActiveOrganizations } from '@crowd/data-access-layer'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import isFeatureEnabled from '@/feature-flags/isFeatureEnabled'
import { IRepositoryOptions } from './IRepositoryOptions'
import OrganizationSyncRemoteRepository from './organizationSyncRemoteRepository'
import SegmentRepository from './segmentRepository'
import { IActiveOrganizationData, IActiveOrganizationFilter } from './types/organizationTypes'
import {
  IFetchOrganizationMergeSuggestionArgs,
  SimilarityScoreRange,
} from '@/types/mergeSuggestionTypes'
import { logExecutionTimeV2 } from '@crowd/logging'

const { Op } = Sequelize

interface IOrganizationId {
  id: string
}

interface IOrganizationNoMerge {
  organizationId: string
  noMergeId: string
}

class OrganizationRepository {
  public static QUERY_FILTER_COLUMN_MAP: Map<string, string> = new Map([
    // id fields
    ['id', 'o.id'],
    ['segmentId', 'osa."segmentId"'],

    // basic fields for filtering
    ['size', 'o.size'],
    ['industry', 'o.industry'],
    ['employees', 'o."employees"'],
    ['lastEnrichedAt', 'o."lastEnrichedAt"'],
    ['founded', 'o."founded"'],
    ['size', 'o."size"'],
    ['headline', 'o."headline"'],
    ['industry', 'o."industry"'],
    ['location', 'o."location"'],
    ['tags', 'o."tags"'],
    ['type', 'o."type"'],

    // basic fields for querying
    ['displayName', 'o."displayName"'],
    ['website', 'o."website"'],
    ['identities', 'o."identities"'],
    ['revenueRange', 'o."revenueRange"'],
    ['employeeGrowthRate', 'o."employeeGrowthRate"'],

    // derived fields
    ['employeeChurnRate12Month', `(o."employeeChurnRate"->>'12_month')::decimal`],
    ['employeeGrowthRate12Month', `(o."employeeGrowthRate"->>'12_month')::decimal`],
    ['revenueRangeMin', `(o."revenueRange"->>'min')::integer`],
    ['revenueRangeMax', `(o."revenueRange"->>'max')::integer`],

    // aggregated fields
    ['activityCount', 'osa."activityCount"'],
    ['memberCount', 'osa."memberCount"'],
    ['activeOn', 'osa."activeOn"'],
    ['joinedAt', 'osa."joinedAt"'],
    ['lastActive', 'osa."lastActive"'],

    // joined fields
    ['identities', 'i."identities"'],
  ])

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
    const toInsert = {
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
    }

    const record = await options.database.organization.create(toInsert, {
      transaction,
    })

    await captureApiChange(
      options,
      organizationCreateAction(record.id, async (captureState) => {
        captureState(toInsert)
      }),
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
            const incomingTags = org.tags || []
            org.tags = lodash.uniq([...existingOrg.tags, ...incomingTags])
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

  static async excludeOrganizationsFromAllSegments(
    organizationIds: string[],
    options: IRepositoryOptions,
  ) {
    const seq = SequelizeRepository.getSequelize(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const bulkDeleteOrganizationSegments = `DELETE FROM "organizationSegments" WHERE "organizationId" in (:organizationIds);`

    await seq.query(bulkDeleteOrganizationSegments, {
      replacements: {
        organizationIds,
      },
      type: QueryTypes.DELETE,
      transaction,
    })
  }

  static ORGANIZATION_UPDATE_COLUMNS = [
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
  ]

  static isEqual = {
    displayName: (a, b) => a === b,
    description: (a, b) => a === b,
    emails: (a, b) => lodash.isEqual((a || []).sort(), (b || []).sort()),
    phoneNumbers: (a, b) => lodash.isEqual((a || []).sort(), (b || []).sort()),
    logo: (a, b) => a === b,
    website: (a, b) => a === b,
    location: (a, b) => a === b,
    isTeamOrganization: (a, b) => a === b,
    attributes: (a, b) => lodash.isEqual(a, b),
    weakIdentities: (a, b) => lodash.isEqual(a, b),
  }

  static async update(
    id,
    data,
    options: IRepositoryOptions,
    overrideIdentities = false,
    manualChange = false,
  ) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await captureApiChange(
      options,
      organizationUpdateAction(id, async (captureOldState, captureNewState) => {
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

        captureOldState(record.get({ plain: true }))

        // check if website already exists in another organization in the same tenant
        if (data.website) {
          const existingOrg = await options.database.organization.findOne({
            where: {
              website: data.website,
              tenantId: currentTenant.id,
            },
            transaction,
          })

          // ensure that it's not the same organization
          if (existingOrg && existingOrg.id !== record.id) {
            throw new Error409(options.language, 'errors.alreadyExists', existingOrg.id)
          }
        }

        // exclude syncRemote attributes, since these are populated from organizationSyncRemote table
        if (data.attributes?.syncRemote) {
          delete data.attributes.syncRemote
        }

        if (manualChange) {
          const manuallyChangedFields: string[] = record.manuallyChangedFields || []

          for (const column of this.ORGANIZATION_UPDATE_COLUMNS) {
            let changed = false

            // only check fields that are in the data object that will be updated
            if (column in data) {
              if (
                record[column] !== null &&
                column in data &&
                (data[column] === null || data[column] === undefined)
              ) {
                // column was removed in the update -> will be set to null by sequelize
                changed = true
              } else if (
                record[column] === null &&
                data[column] !== null &&
                data[column] !== undefined
              ) {
                // column was null before now it's not anymore
                changed = true
              } else if (
                this.isEqual[column] &&
                this.isEqual[column](record[column], data[column]) === false
              ) {
                // column value has changed
                changed = true
              }
            }

            if (changed && !manuallyChangedFields.includes(column)) {
              manuallyChangedFields.push(column)
            }
          }

          data.manuallyChangedFields = manuallyChangedFields
        } else {
          // ignore columns that were manually changed
          // by rewriting them with db data
          const manuallyChangedFields: string[] = record.manuallyChangedFields || []
          for (const manuallyChangedColumn of manuallyChangedFields) {
            data[manuallyChangedColumn] = record[manuallyChangedColumn]
          }

          data.manuallyChangedFields = manuallyChangedFields
        }

        const updatedData = {
          ...lodash.pick(data, this.ORGANIZATION_UPDATE_COLUMNS),
          updatedById: currentUser.id,
          manuallyChangedFields: data.manuallyChangedFields,
        }
        captureNewState(updatedData)
        await options.database.organization.update(updatedData, {
          where: {
            id: record.id,
          },
          transaction,
        })

        return record
      }),
      !manualChange, // skip audit log if not a manual change
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

    await captureApiChange(
      options,
      organizationEditIdentitiesAction(id, async (captureOldState, captureNewState) => {
        const qx = SequelizeRepository.getQueryExecutor(options, transaction)
        const initialIdentities = await fetchOrgIdentities(qx, id)

        function convertIdentitiesForAudit(identities) {
          return identities.reduce((acc, r) => {
            if (!acc[r.platform]) {
              acc[r.platform] = []
            }

            acc[r.platform].push(r.name)
            acc[r.platform] = lodash.uniq(acc[r.platform])
            acc[r.platform] = acc[r.platform].sort()

            return acc
          }, {})
        }

        captureOldState(convertIdentitiesForAudit(initialIdentities))

        if (data.identities && data.identities.length > 0) {
          if (overrideIdentities) {
            captureNewState(
              convertIdentitiesForAudit(
                data.identities.map((i) => ({ platform: i.platform, name: i.name })),
              ),
            )
            await this.setIdentities(id, data.identities, options)
          } else {
            captureNewState(convertIdentitiesForAudit([...initialIdentities, ...data.identities]))
            await OrganizationRepository.addIdentities(id, data.identities, options)
          }
        }
      }),
    )

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

  static async destroy(
    id,
    options: IRepositoryOptions,
    force = false,
    destroyIfOnlyNoSegmentsLeft = true,
  ) {
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

    if (destroyIfOnlyNoSegmentsLeft) {
      await OrganizationRepository.excludeOrganizationsFromSegments([id], {
        ...options,
        transaction,
      })
      const org = await this.findById(id, options)

      if (org.segments.length === 0) {
        await record.destroy({
          transaction,
          force,
        })
      }
    } else {
      await OrganizationRepository.excludeOrganizationsFromAllSegments([id], {
        ...options,
        transaction,
      })

      await record.destroy({
        transaction,
        force,
      })
    }

    await this._createAuditLog(AuditLogRepository.DELETE, record, record, options)
  }

  static async setIdentities(
    organizationId: string,
    identities: IOrganizationIdentity[],
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const qx = SequelizeRepository.getQueryExecutor(options, transaction)

    await cleanUpOrgIdentities(qx, { organizationId, tenantId: currentTenant.id })

    await OrganizationRepository.addIdentities(organizationId, identities, options)
  }

  static async addIdentities(
    organizationId: string,
    identities: IOrganizationIdentity[],
    options: IRepositoryOptions,
  ) {
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
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const qx = SequelizeRepository.getQueryExecutor(options, transaction)

    await addOrgIdentity(qx, {
      organizationId,
      platform: identity.platform,
      sourceId: identity.sourceId || null,
      url: identity.url || null,
      tenantId: currentTenant.id,
      integrationId: identity.integrationId || null,
      name: identity.name,
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

  static async countOrganizationMergeSuggestions(
    organizationFilter: string,
    similarityFilter: string,
    displayNameFilter: string,
    replacements: {
      segmentIds: string[]
      organizationId?: string
      displayName?: string
      mergeActionType: MergeActionType
      mergeActionStatus: MergeActionState
      tenantId: string
    },
    options: IRepositoryOptions,
  ): Promise<number> {
    const result = await options.database.sequelize.query(
      `
      WITH
      cte AS (
        SELECT
          Greatest(Hashtext(Concat(org.id, otm."toMergeId")), Hashtext(Concat(otm."toMergeId", org.id))) as hash,
          org.id,
          otm."toMergeId",
          org."createdAt",
          otm."similarity"
        FROM organizations org
        JOIN "organizationToMerge" otm ON org.id = otm."organizationId"
        JOIN "organization_segments_mv" os1 ON os1."organizationId" = org.id
        JOIN "organization_segments_mv" os2 ON os2."organizationId" = otm."toMergeId"
        join organizations o1 on o1.id = org.id
        join organizations o2 on o2.id = otm."toMergeId"
        LEFT JOIN "mergeActions" ma
          ON ma.type = :mergeActionType
          AND ma."tenantId" = :tenantId
          AND (
            (ma."primaryId" = org.id AND ma."secondaryId" = otm."toMergeId")
            OR (ma."primaryId" = otm."toMergeId" AND ma."secondaryId" = org.id)
          )
        WHERE org."tenantId" = :tenantId
          AND os1."segmentId" IN (:segmentIds)
          AND os2."segmentId" IN (:segmentIds)
          AND (ma.id IS NULL OR ma.state = :mergeActionStatus)
          ${organizationFilter}
          ${similarityFilter}
          ${displayNameFilter}
      )
      SELECT COUNT(DISTINCT hash) AS total_count
      FROM cte
      `,
      {
        replacements,
        type: QueryTypes.SELECT,
      },
    )

    return result[0]?.total_count || 0
  }

  static async findOrganizationsWithMergeSuggestions(
    args: IFetchOrganizationMergeSuggestionArgs,
    options: IRepositoryOptions,
  ) {
    const HIGH_CONFIDENCE_LOWER_BOUND = 0.9
    const MEDIUM_CONFIDENCE_LOWER_BOUND = 0.7

    let segmentIds: string[]

    if (args.filter?.projectIds) {
      segmentIds = (
        await new SegmentRepository(options).getSegmentSubprojects(args.filter.projectIds)
      ).map((s) => s.id)
    } else if (args.filter?.subprojectIds) {
      segmentIds = args.filter.subprojectIds
    } else {
      segmentIds = SequelizeRepository.getSegmentIds(options)
    }

    let similarityFilter = ''
    const similarityConditions = []

    for (const similarity of args.filter?.similarity || []) {
      if (similarity === SimilarityScoreRange.HIGH) {
        similarityConditions.push(`(otm.similarity >= ${HIGH_CONFIDENCE_LOWER_BOUND})`)
      } else if (similarity === SimilarityScoreRange.MEDIUM) {
        similarityConditions.push(
          `(otm.similarity >= ${MEDIUM_CONFIDENCE_LOWER_BOUND} and otm.similarity < ${HIGH_CONFIDENCE_LOWER_BOUND})`,
        )
      } else if (similarity === SimilarityScoreRange.LOW) {
        similarityConditions.push(`(otm.similarity < ${MEDIUM_CONFIDENCE_LOWER_BOUND})`)
      }
    }

    if (similarityConditions.length > 0) {
      similarityFilter = ` and (${similarityConditions.join(' or ')})`
    }

    const organizationFilter = args.filter?.organizationId
      ? ` AND ("otm"."organizationId" = :organizationId OR "otm"."toMergeId" = :organizationId)`
      : ''

    const displayNameFilter = args.filter?.displayName
      ? ` and (o1."displayName" ilike :displayName OR o2."displayName" ilike :displayName)`
      : ''

    let order =
      '"organizationsToMerge".similarity desc, "organizationsToMerge"."id", "organizationsToMerge"."toMergeId"'

    if (args.orderBy?.length > 0) {
      order = ''
      for (const orderBy of args.orderBy) {
        const [field, direction] = orderBy.split('_')
        if (['similarity'].includes(field) && ['asc', 'desc'].includes(direction.toLowerCase())) {
          order += `"organizationsToMerge".${field} ${direction}, `
        }
      }

      order += '"organizationsToMerge"."id", "organizationsToMerge"."toMergeId"'
    }

    if (args.countOnly) {
      const totalCount = await this.countOrganizationMergeSuggestions(
        organizationFilter,
        similarityFilter,
        displayNameFilter,
        {
          segmentIds,
          displayName: args?.filter?.displayName ? `${args.filter.displayName}%` : undefined,
          organizationId: args?.filter?.organizationId,
          mergeActionType: MergeActionType.ORG,
          mergeActionStatus: MergeActionState.ERROR,
          tenantId: options.currentTenant.id,
        },
        options,
      )

      return { count: totalCount }
    }

    const orgs = await options.database.sequelize.query(
      `WITH
      cte AS (
        SELECT
          Greatest(Hashtext(Concat(org.id, otm."toMergeId")), Hashtext(Concat(otm."toMergeId", org.id))) as hash,
          org.id,
          otm."toMergeId",
          org."createdAt",
          otm."similarity",
          o1."displayName" as "primaryDisplayName",
          o1.logo as "primaryLogo",
          o2."displayName" as "secondaryDisplayName",
          o2.logo as "secondaryLogo"
        FROM organizations org
        JOIN "organizationToMerge" otm ON org.id = otm."organizationId"
        JOIN "organization_segments_mv" os1 ON os1."organizationId" = org.id
        JOIN "organization_segments_mv" os2 ON os2."organizationId" = otm."toMergeId"
        join organizations o1 on o1.id = org.id
        join organizations o2 on o2.id = otm."toMergeId"
        LEFT JOIN "mergeActions" ma
          ON ma.type = :mergeActionType
          AND ma."tenantId" = :tenantId
          AND (
            (ma."primaryId" = org.id AND ma."secondaryId" = otm."toMergeId")
            OR (ma."primaryId" = otm."toMergeId" AND ma."secondaryId" = org.id)
          )
        WHERE org."tenantId" = :tenantId
          AND os1."segmentId" IN (:segmentIds)
          AND os2."segmentId" IN (:segmentIds)
          AND (ma.id IS NULL OR ma.state = :mergeActionStatus)
          ${organizationFilter}
          ${similarityFilter}
          ${displayNameFilter}
      ),

      count_cte AS (
        SELECT COUNT(DISTINCT hash) AS total_count
        FROM cte
      ),

      final_select AS (
        SELECT DISTINCT ON (hash)
          id,
          "toMergeId",
          "primaryDisplayName",
          "primaryLogo",
          "secondaryDisplayName",
          "secondaryLogo",
          "createdAt",
          "similarity"
        FROM cte
        ORDER BY hash, id
      )

      SELECT
        "organizationsToMerge".id,
        "organizationsToMerge"."toMergeId",
        "organizationsToMerge"."primaryDisplayName",
        "organizationsToMerge"."primaryLogo",
        "organizationsToMerge"."secondaryDisplayName",
        "organizationsToMerge"."secondaryLogo",
        count_cte."total_count",
        "organizationsToMerge"."similarity"
      FROM
        final_select AS "organizationsToMerge",
        count_cte
      ORDER BY
        ${order}
      LIMIT :limit OFFSET :offset
    `,
      {
        replacements: {
          tenantId: options.currentTenant.id,
          segmentIds,
          limit: args.limit,
          offset: args.offset,
          displayName: args?.filter?.displayName ? `${args.filter.displayName}%` : undefined,
          mergeActionType: MergeActionType.ORG,
          mergeActionStatus: MergeActionState.ERROR,
          organizationId: args?.filter?.organizationId,
        },
        type: QueryTypes.SELECT,
      },
    )

    if (orgs.length > 0) {
      let result

      if (args.detail) {
        const organizationPromises = []
        const toMergePromises = []

        for (const org of orgs) {
          organizationPromises.push(OrganizationRepository.findById(org.id, options))
          toMergePromises.push(OrganizationRepository.findById(org.toMergeId, options))
        }

        const organizationResults = await Promise.all(organizationPromises)
        const organizationToMergeResults = await Promise.all(toMergePromises)

        result = organizationResults.map((i, idx) => ({
          organizations: [i, organizationToMergeResults[idx]],
          similarity: orgs[idx].similarity,
        }))
      } else {
        result = orgs.map((o) => ({
          organizations: [
            {
              id: o.id,
              displayName: o.primaryDisplayName,
              logo: o.primaryLogo,
            },
            {
              id: o.toMergeId,
              displayName: o.secondaryDisplayName,
              logo: o.secondaryLogo,
            },
          ],
          similarity: o.similarity,
        }))
      }

      return { rows: result, count: orgs[0].total_count, limit: args.limit, offset: args.offset }
    }

    return {
      rows: [{ organizations: [], similarity: 0 }],
      count: 0,
      limit: args.limit,
      offset: args.offset,
    }
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

  static async findByIdentities(
    identities: IOrganizationIdentity[],
    options: IRepositoryOptions,
  ): Promise<IOrganization> {
    const transaction = SequelizeRepository.getTransaction(options)
    const sequelize = SequelizeRepository.getSequelize(options)
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const identityConditions = identities
      .map(
        (identity, index) => `
            (oi.platform = :platform${index} and oi.name = :name${index})
        `,
      )
      .join(' or ')

    const results = await sequelize.query(
      `
      with
          "organizationsWithIdentity" as (
              select oi."organizationId"
              from "organizationIdentities" oi
              where ${identityConditions}
          ),
          "organizationsWithCounts" as (
            select o.id, count(oi."organizationId") as total_counts
            from organizations o
            join "organizationIdentities" oi on o.id = oi."organizationId"
            where o.id in (select "organizationId" from "organizationsWithIdentity")
            group by o.id
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
          inner join "organizationsWithCounts" oc on o.id = oc.id
          where o."tenantId" = :tenantId
          order by oc.total_counts desc
          limit 1;
      `,
      {
        replacements: {
          tenantId: currentTenant.id,
          ...identities.reduce(
            (acc, identity, index) => ({
              ...acc,
              [`platform${index}`]: identity.platform,
              [`name${index}`]: identity.name,
            }),
            {},
          ),
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
    let extraCTEs = `
      leaf_segment_ids AS (
        select id
        from segments
        where "tenantId" = :tenantId and "parentSlug" is not null and "grandparentSlug" is not null
      ),
    `

    if (segmentId) {
      // we load data for a specific segment (can be leaf, parent or grand parent id)
      replacements.segmentId = segmentId
      extraCTEs = `
        leaf_segment_ids AS (
          SELECT
              s.id
          FROM segments s
          JOIN segments sp ON sp.slug = s."parentSlug"
              AND sp."grandparentSlug" IS NULL
              AND sp."parentSlug" IS NOT NULL
              AND sp."tenantId" = s."tenantId"
          JOIN segments sgp ON sgp.slug = sp."parentSlug"
              AND sgp."parentSlug" IS NULL
              AND sgp."grandparentSlug" IS NULL
              AND sgp."tenantId" = s."tenantId"
          WHERE s."parentSlug" IS NOT NULL
            AND s."grandparentSlug" IS NOT NULL
            AND s."tenantId" = :tenantId
            AND (
              s.id = :segmentId
              OR sp.id = :segmentId
              OR sgp.id = :segmentId
            )
        ),
      `
    }

    const query = `
      WITH
        ${extraCTEs}
        member_data AS (
          select
            a."organizationId",
            count(distinct a."memberId")                                                        as "memberCount",
            count(distinct a.id)                                                        as "activityCount",
            case
                when array_agg(distinct a.platform::TEXT) = array [null] then array []::text[]
                else array_agg(distinct a.platform::TEXT) end                                 as "activeOn",
            max(a.timestamp)                                                            as "lastActive",
            min(a.timestamp) filter ( where a.timestamp <> '1970-01-01T00:00:00.000Z' ) as "joinedAt"
          from leaf_segment_ids ls
          join mv_activities_cube a on a."segmentId" = ls.id and a."organizationId" = :id
          group by a."organizationId"
        ),
        organization_segments AS (
          select "organizationId", array_agg("segmentId") as "segments"
          from "organizationSegments"
          where "organizationId" = :id
          group by "organizationId"
        ),
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

  static async findByIdOpensearch(
    id: string,
    options: IRepositoryOptions,
    segmentId?: string,
  ): Promise<PageData<any>> {
    const segments = segmentId ? [segmentId] : SequelizeRepository.getSegmentIds(options)

    const response = await this.findAndCountAllOpensearch(
      {
        filter: {
          and: [
            {
              id: {
                eq: id,
              },
            },
          ],
        },
        isProfileQuery: true,
        limit: 1,
        offset: 0,
        segments,
      },
      options,
    )

    if (response.count === 0) {
      throw new Error404()
    }

    const result = response.rows[0]

    // Parse attributes that are indexed as strings
    if (result.attributes) {
      result.attributes = JSON.parse(result.attributes)
    }

    return result
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
      isProfileQuery = false,
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

    if (!isProfileQuery && filter.and) {
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

    if (segmentsEnabled && segment) {
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

  static async findAndCountActiveOpensearch(
    filter: IActiveOrganizationFilter,
    limit: number,
    offset: number,
    orderBy: string,
    options: IRepositoryOptions,
    segments: string[] = [],
  ): Promise<PageData<IActiveOrganizationData>> {
    const tenant = SequelizeRepository.getCurrentTenant(options)

    const segmentsEnabled = await isFeatureEnabled(FeatureFlag.SEGMENTS, options)

    if (segments.length !== 1) {
      throw new Error400(
        `This operation can have exactly one segment. Found ${segments.length} segments.`,
      )
    }

    const originalSegment = segments[0]

    const segmentRepository = new SegmentRepository(options)

    const segment = await segmentRepository.findById(originalSegment)

    if (segment === null) {
      return {
        rows: [],
        count: 0,
        limit,
        offset,
      }
    }

    if (SegmentRepository.isProjectGroup(segment)) {
      segments = (segment as SegmentProjectGroupNestedData).projects.reduce((acc, p) => {
        acc.push(...p.subprojects.map((sp) => sp.id))
        return acc
      }, [])
    } else if (SegmentRepository.isProject(segment)) {
      segments = (segment as SegmentProjectNestedData).subprojects.map((sp) => sp.id)
    } else {
      segments = [originalSegment]
    }

    const activeOrgsResults = await getActiveOrganizations(options.qdb, {
      timestampFrom: filter.activityTimestampFrom,
      timestampTo: filter.activityTimestampTo,
      tenantId: tenant.id,
      platforms: filter.platforms ? filter.platforms : undefined,
      segmentIds: segments,
      offset: 0,
      limit: 10000,
      orderByDirection: orderBy.split('_')[1].toLowerCase() === 'desc' ? 'desc' : 'asc',
      orderBy: orderBy.startsWith('activityCount') ? 'activityCount' : 'activeDaysCount',
    })

    const organizationIds = []
    const organizationMap = {}

    for (const res of activeOrgsResults) {
      organizationIds.push(res.organizationId)
      organizationMap[res.organizationId] = {
        activityCount: res.activityCount,
        activeDaysCount: res.activeDaysCount,
      }
    }

    if (organizationIds.length === 0) {
      return {
        rows: [],
        count: 0,
        limit,
        offset,
      }
    }

    const organizationQueryPayload = {
      and: [
        {
          id: {
            in: organizationIds,
          },
        },
      ],
    } as any

    if (filter.isTeamOrganization === true) {
      organizationQueryPayload.and.push({
        isTeamOrganization: {
          eq: true,
        },
      })
    } else if (filter.isTeamOrganization === false) {
      organizationQueryPayload.and.push({
        isTeamOrganization: {
          not: true,
        },
      })
    }

    // to retain the sort came from activity query
    const customSortFunction = {
      _script: {
        type: 'number',
        script: {
          lang: 'painless',
          source: `
              def organizationId = doc['uuid_organizationId'].value;
              return params.organizationIds.indexOf(organizationId);
            `,
          params: {
            organizationIds: organizationIds.map((i) => `${i}`),
          },
        },
        order: 'asc',
      },
    }

    const organizations = await this.findAndCountAllOpensearch(
      {
        filter: organizationQueryPayload,
        segments: [originalSegment],
        countOnly: false,
        limit,
        offset,
        customSortFunction,
      },
      options,
    )

    return {
      rows: organizations.rows.map((o) => {
        o.activityCount = organizationMap[o.id].activityCount.value
        o.activeDaysCount = organizationMap[o.id].activeDaysCount.value
        return o
      }),
      count: organizations.count,
      offset,
      limit,
    }
  }

  static async findAndCountAll(
    {
      filter = {} as any,
      limit = 20,
      offset = 0,
      orderBy = 'joinedAt_DESC',
      segments = [] as string[],
      fields = [],
    },
    options: IRepositoryOptions,
  ) {
    if (segments.length !== 1) {
      throw new Error400(
        options.language,
        `This operation can have exactly one segment. Found ${segments.length} segments.`,
      )
    }

    const segment = await new SegmentRepository(options).findById(segments[0])

    if (segment === null) {
      options.log.info('No segment found for organization')
      return {
        rows: [],
        count: 0,
        limit,
        offset,
      }
    }

    const params = {
      limit,
      offset,
      tenantId: options.currentTenant.id,
      segmentId: segment.id,
    }

    const filterString = RawQueryParser.parseFilters(
      filter,
      OrganizationRepository.QUERY_FILTER_COLUMN_MAP,
      [],
      params,
      true,
    )

    const order = (function prepareOrderBy(orderBy = 'lastActive_DESC') {
      const orderSplit = orderBy.split('_')

      const orderField = OrganizationRepository.QUERY_FILTER_COLUMN_MAP.get(orderSplit[0])
      if (!orderField) {
        return 'osa."lastActive" DESC'
      }
      const orderDirection = ['DESC', 'ASC'].includes(orderSplit[1]) ? orderSplit[1] : 'DESC'

      return `${orderField} ${orderDirection}`
    })(orderBy)

    const qx = SequelizeRepository.getQueryExecutor(options)

    function createQuery(fields) {
      return `
        WITH
          identities AS (
            SELECT
              oi."organizationId",
              jsonb_agg(oi) AS "identities"
            FROM "organizationIdentities" oi
            WHERE oi."tenantId" = $(tenantId)
            GROUP BY oi."organizationId"
          )
        SELECT
          ${fields}
        FROM organizations o
        JOIN "organizationSegmentsAgg" osa ON osa."organizationId" = o.id
        LEFT JOIN identities i ON o.id = i."organizationId"
        WHERE osa."segmentId" = $(segmentId)
          AND o."tenantId" = $(tenantId)
          AND (${filterString})
      `
    }

    const [rows, count] = await Promise.all([
      qx.select(
        `
          ${createQuery(
            (function prepareFields(fields) {
              return fields
                .map((f) => {
                  const mappedField = OrganizationRepository.QUERY_FILTER_COLUMN_MAP.get(f)
                  if (!mappedField) {
                    throw new Error400(options.language, `Invalid field: ${f}`)
                  }

                  return mappedField
                })
                .join(',\n')
            })(fields),
          )}
          ORDER BY ${order}
          LIMIT $(limit)
          OFFSET $(offset)
        `,
        params,
      ),
      qx.selectOne(createQuery('COUNT(*)'), params),
    ])

    return { rows, count: parseInt(count.count, 10), limit, offset }
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

  static async findByIds(ids: string[], options: IRepositoryOptions) {
    const records = await options.database.sequelize.query(
      `
        SELECT
            o."id",
            o."displayName",
            o."logo"
        FROM "organizations" AS o
        WHERE o."id" IN (:ids);
      `,
      {
        replacements: {
          ids,
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

  static calculateRenderFriendlyOrganizations(
    memberOrganizations: IMemberRoleWithOrganization[],
  ): IMemberRenderFriendlyRole[] {
    const organizations: IMemberRenderFriendlyRole[] = []

    for (const role of memberOrganizations) {
      organizations.push({
        id: role.organizationId,
        displayName: role.organizationName,
        logo: role.organizationLogo,
        memberOrganizations: role,
      })
    }

    return organizations
  }

  static async getActivityCountInPlatform(
    organizationId: string,
    platform: string,
    options: IRepositoryOptions,
  ): Promise<number> {
    const seq = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)

    const query = `
    SELECT count(*) as count
        FROM "mv_activities_cube"
        WHERE "organizationId" = :organizationId AND platform = :platform`

    const result = await seq.query(query, {
      replacements: {
        organizationId,
        platform,
      },
      type: QueryTypes.SELECT,
      transaction,
    })

    return (result[0] as any).count as number
  }

  static async getMemberCountInPlatform(
    organizationId: string,
    platform: string,
    options: IRepositoryOptions,
  ): Promise<number> {
    const seq = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)

    const query = `
    select count(distinct  "memberId") from mv_activities_cube
    where "organizationId" = :organizationId AND platform = :platform`

    const result = await seq.query(query, {
      replacements: {
        organizationId,
        platform,
      },
      type: QueryTypes.SELECT,
      transaction,
    })

    return (result[0] as any).count as number
  }

  static async removeIdentitiesFromOrganization(
    organizationId: string,
    identities: IOrganizationIdentity[],
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)

    const seq = SequelizeRepository.getSequelize(options)

    const query = `
      delete from "organizationIdentities" where "organizationId" = :organizationId and platform = :platform and name = :name;
    `

    for (const identity of identities) {
      await seq.query(query, {
        replacements: {
          organizationId,
          name: identity.name,
          platform: identity.platform,
        },
        type: QueryTypes.DELETE,
        transaction,
      })
    }
  }
}

export default OrganizationRepository
