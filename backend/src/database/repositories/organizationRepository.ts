import {
  captureApiChange,
  organizationCreateAction,
  organizationEditIdentitiesAction,
  organizationUpdateAction,
} from '@crowd/audit-logs'
import { Error400, Error404, Error409, PageData, RawQueryParser } from '@crowd/common'
import {
  countMembersWithActivities,
  getActiveOrganizations,
  queryActivities,
} from '@crowd/data-access-layer'
import { findManyLfxMemberships } from '@crowd/data-access-layer/src/lfx_memberships'
import {
  addOrgIdentity,
  cleanupForOganization,
  cleanUpOrgIdentities,
  deleteOrgAttributesByOrganizationId,
  fetchManyOrgIdentities,
  fetchManyOrgSegments,
  fetchOrgIdentities,
  findManyOrgAttributes,
  findOrgAttributes,
  findOrgById,
  IDbOrganization,
  IDbOrgAttribute,
  markOrgAttributeDefault,
  OrgIdentityField,
  queryOrgIdentities,
  updateOrgIdentityVerifiedFlag,
  upsertOrgAttributes,
} from '@crowd/data-access-layer/src/organizations'
import { findAttribute } from '@crowd/data-access-layer/src/organizations/attributesConfig'
import { optionsQx } from '@crowd/data-access-layer/src/queryExecutor'
import {
  findSegmentById,
  isSegmentProject,
  isSegmentProjectGroup,
} from '@crowd/data-access-layer/src/segments'
import { FieldTranslatorFactory, OpensearchQueryParser } from '@crowd/opensearch'
import {
  FeatureFlag,
  IMemberRenderFriendlyRole,
  IMemberRoleWithOrganization,
  IOrganizationIdentity,
  MergeActionState,
  MergeActionType,
  OpenSearchIndex,
  OrganizationIdentityType,
  SegmentData,
  SegmentProjectGroupNestedData,
  SegmentProjectNestedData,
} from '@crowd/types'
import lodash, { uniq } from 'lodash'
import Sequelize, { QueryTypes } from 'sequelize'
import validator from 'validator'
import isFeatureEnabled from '@/feature-flags/isFeatureEnabled'
import {
  IFetchOrganizationMergeSuggestionArgs,
  SimilarityScoreRange,
} from '@/types/mergeSuggestionTypes'
import { IRepositoryOptions } from './IRepositoryOptions'
import AuditLogRepository from './auditLogRepository'
import SegmentRepository from './segmentRepository'
import SequelizeRepository from './sequelizeRepository'
import { IActiveOrganizationData, IActiveOrganizationFilter } from './types/organizationTypes'

const { Op } = Sequelize

interface IOrganizationId {
  id: string
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
    ['headline', 'o."headline"'],
    ['location', 'o."location"'],
    ['tags', 'o."tags"'],
    ['type', 'o."type"'],
    ['isTeamOrganization', 'o."isTeamOrganization"'],

    // basic fields for querying
    ['displayName', 'o."displayName"'],
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
    ['avgContributorEngagement', 'osa."avgContributorEngagement"'],

    // org fields for display
    ['logo', 'o."logo"'],
    ['description', 'o."description"'],
  ])

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
        'headline',
        'logo',
        'importHash',
        'isTeamOrganization',
        'lastEnrichedAt',
        'manuallyCreated',
      ]),

      tenantId: tenant.id,
      createdById: currentUser.id,
      updatedById: currentUser.id,
    }

    const record = await options.database.organization.create(toInsert, {
      transaction,
    })

    // prepare attributes object
    const attributes = {} as any

    if (data.logo) {
      attributes.logo = {
        custom: [data.logo],
        default: data.logo,
      }
    }

    await this.updateOrgAttributes(record.id, { attributes }, options)

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
    'importHash',
    'isTeamOrganization',
    'headline',
    'lastEnrichedAt',

    // default attributes
    'type',
    'industry',
    'founded',
    'size',
    'employees',
    'displayName',
    'description',
    'logo',
    'tags',
    'location',
    'employees',
    'revenueRange',
    'employeeChurnRate',
    'employeeGrowthRate',
  ]

  static isEqual = {
    displayName: (a, b) => a === b,
    description: (a, b) => a === b,
    emails: (a, b) => lodash.isEqual((a || []).sort(), (b || []).sort()),
    phoneNumbers: (a, b) => lodash.isEqual((a || []).sort(), (b || []).sort()),
    logo: (a, b) => a === b,
    location: (a, b) => a === b,
    isTeamOrganization: (a, b) => a === b,
    attributes: (a, b) => lodash.isEqual(a, b),
  }

  static convertOrgAttributesForInsert(data: any) {
    const orgAttributes = []
    const defaultColumns = {}

    for (const [name, attribute] of Object.entries(data.attributes)) {
      const attributeDefinition = findAttribute(name)

      if (!(attribute as any).custom) {
        continue // eslint-disable-line no-continue
      }

      for (const value of (attribute as any).custom) {
        const isDefault = value === (attribute as any).default

        orgAttributes.push({
          type: attributeDefinition.type,
          name,
          source: 'custom',
          default: isDefault,
          value,
        })

        if (isDefault && attributeDefinition.defaultColumn) {
          defaultColumns[attributeDefinition.defaultColumn] = value
        }
      }
    }

    return {
      orgAttributes,
      defaultColumns,
    }
  }

  static findLfxMembershipInFilters(filter: any): any {
    if (!filter) return null

    if (filter.lfxMembership) {
      return filter.lfxMembership
    }

    if (Array.isArray(filter.and)) {
      for (const subFilter of filter.and) {
        const result = OrganizationRepository.findLfxMembershipInFilters(subFilter)
        if (result) {
          return result
        }
      }
    }

    return null
  }

  static convertOrgAttributesForDisplay(attributes: IDbOrgAttribute[]) {
    return attributes.reduce((acc, a) => {
      if (!acc[a.name]) {
        acc[a.name] = {}
      }
      if (!acc[a.name][a.source]) {
        acc[a.name][a.source] = []
      }

      acc[a.name][a.source].push(a.value)
      if (a.default) {
        acc[a.name].default = a.value
      }
      return acc
    }, {})
  }

  static async updateOrgAttributes(organizationId: string, data: any, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)
    const qx = SequelizeRepository.getQueryExecutor(options, transaction)

    const { orgAttributes, defaultColumns } =
      OrganizationRepository.convertOrgAttributesForInsert(data)

    await upsertOrgAttributes(qx, organizationId, orgAttributes)
    for (const attr of orgAttributes) {
      if (attr.default) {
        await markOrgAttributeDefault(qx, organizationId, attr)
      }
    }

    return defaultColumns
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

    const seq = SequelizeRepository.getSequelize(options)

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

        if (data.identities) {
          const primaryDomainIdentity = data.identities.find(
            (i) => i.type === OrganizationIdentityType.PRIMARY_DOMAIN && i.verified,
          )

          // check if domain already exists in another organization in the same tenant
          if (primaryDomainIdentity) {
            const existingOrg = (await seq.query(
              `
          select "organizationId"
          from "organizationIdentities"
          where
            "tenantId" = :tenantId and
            "organizationId" <> :id and
            type = :type and
            value = :value and
            verified = true
          `,
              {
                replacements: {
                  tenantId: currentTenant.id,
                  id: record.id,
                  type: OrganizationIdentityType.PRIMARY_DOMAIN,
                  value: primaryDomainIdentity.value,
                },
                type: QueryTypes.SELECT,
                transaction,
              },
            )) as any[]

            // ensure that it's not the same organization
            if (existingOrg && existingOrg.length > 0) {
              throw new Error409(
                options.language,
                'errors.alreadyExists',
                existingOrg[0].organizationId,
              )
            }
          }
        }

        if (data.attributes) {
          const defaultColumns = await OrganizationRepository.updateOrgAttributes(
            record.id,
            data,
            options,
          )
          for (const col of Object.keys(defaultColumns)) {
            data[col] = defaultColumns[col]
          }
        }

        const updatedData = {
          ...lodash.pick(data, this.ORGANIZATION_UPDATE_COLUMNS),
          updatedById: currentUser.id,
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

        function convertIdentitiesForAudit(identities: IOrganizationIdentity[]) {
          return identities.reduce((acc, r) => {
            if (!acc[r.platform]) {
              acc[r.platform] = []
            }

            acc[r.platform].push({
              value: r.value,
              type: r.type,
              verified: r.verified,
            })

            acc[r.platform] = acc[r.platform].sort((a, b) =>
              `${a.value}:${a.type}:${a.verified}`.localeCompare(
                `${b.value}:${b.type}:${b.verified}`,
              ),
            )

            return acc
          }, {})
        }

        captureOldState(convertIdentitiesForAudit(initialIdentities))

        if (data.identities && data.identities.length > 0) {
          if (overrideIdentities) {
            captureNewState(
              convertIdentitiesForAudit(
                data.identities.map((i) => ({
                  platform: i.platform,
                  value: i.value,
                  type: i.type,
                  verified: i.verified,
                })),
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

    await OrganizationRepository.excludeOrganizationsFromAllSegments([id], {
      ...options,
      transaction,
    })

    const qx = SequelizeRepository.getQueryExecutor(options)

    await cleanupForOganization(qx, id)

    await deleteOrgAttributesByOrganizationId(qx, id)

    await record.destroy({
      transaction,
      force,
    })

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

    await cleanUpOrgIdentities(qx, organizationId, currentTenant.id)

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

  static async updateIdentity(
    organizationId: string,
    identity: IOrganizationIdentity,
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const qx = SequelizeRepository.getQueryExecutor(options, transaction)

    await updateOrgIdentityVerifiedFlag(qx, {
      organizationId,
      tenantId: currentTenant.id,
      platform: identity.platform,
      value: identity.value,
      type: identity.type,
      verified: identity.verified,
    })
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
      value: identity.value,
      type: identity.type,
      verified: identity.verified,
      tenantId: currentTenant.id,
      integrationId: identity.integrationId || null,
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
      select "sourceId", platform, value, type, verified, "integrationId", "organizationId" from "organizationIdentities"
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
        value = :value and
        type = :type and
        verified = :verified;
    `

    for (const identity of identitiesToMove) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, count] = await seq.query(query, {
        replacements: {
          tenantId: tenant.id,
          oldOrganizationId: fromOrganizationId,
          newOrganizationId: toOrganizationId,
          platform: identity.platform,
          value: identity.value,
          type: identity.type,
          verified: identity.verified,
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
          o2.logo as "secondaryLogo",
          os1."segmentId" as "primarySegmentId",
          os2."segmentId" as "secondarySegmentId"
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
          "similarity",
          "primarySegmentId",
          "secondarySegmentId"
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
        "organizationsToMerge"."primarySegmentId",
        "organizationsToMerge"."secondarySegmentId",
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
          organizationPromises.push(
            OrganizationRepository.findById(org.id, options, org.primarySegmentId),
          )
          toMergePromises.push(
            OrganizationRepository.findById(org.toMergeId, options, org.secondarySegmentId),
          )
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

      const qx = SequelizeRepository.getQueryExecutor(options)
      const organizationIds = uniq(result.map((r) => r.organizations[0].id))
      const lfxMemberships = await findManyLfxMemberships(qx, {
        organizationIds,
        tenantId: options.currentTenant.id,
      })
      result.forEach((r) => {
        r.organizations.forEach((org) => {
          org.lfxMembership = lfxMemberships.find((m) => m.organizationId === org.id)
        })
      })

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

  static async findByVerifiedIdentities(
    identities: IOrganizationIdentity[],
    options: IRepositoryOptions,
  ): Promise<IDbOrganization | null> {
    const transaction = SequelizeRepository.getTransaction(options)
    const qx = SequelizeRepository.getQueryExecutor(options, transaction)

    const foundOrgs = await queryOrgIdentities(qx, {
      fields: [OrgIdentityField.ORGANIZATION_ID],
      filter: {
        or: identities.map((identity) => ({
          and: [
            { platform: { eq: identity.platform } },
            { value: { eq: identity.value } },
            { type: { eq: identity.type } },
            { verified: { eq: true } },
          ],
        })),
      },
    })

    if (foundOrgs.length === 0) {
      return null
    }

    const foundOrgsIdentities = await fetchManyOrgIdentities(
      qx,
      foundOrgs.map((o) => o.organizationId),
      options.currentTenant.id,
    )

    const orgIdWithMostIdentities = foundOrgsIdentities.sort(
      (a, b) => b.identities.length - a.identities.length,
    )[0].organizationId

    const result = await findOrgById(qx, orgIdWithMostIdentities)

    return result
  }

  static async findById(id: string, options: IRepositoryOptions, segmentId?: string) {
    let orgResponse = null

    orgResponse = await OrganizationRepository.findAndCountAll(
      {
        filter: { id: { eq: id } },
        limit: 1,
        offset: 0,
        segmentId,
        include: {
          aggregates: true,
          attributes: true,
          lfxMemberships: true,
          identities: true,
          segments: true,
        },
      },
      options,
    )

    if (orgResponse.count === 0) {
      // try it again without segment information (no aggregates)
      // for orgs without activities
      orgResponse = await OrganizationRepository.findAndCountAll(
        {
          filter: { id: { eq: id } },
          limit: 1,
          offset: 0,
          include: {
            aggregates: false,
            attributes: true,
            lfxMemberships: true,
            identities: true,
            segments: true,
          },
        },
        options,
      )

      if (orgResponse.count === 0) {
        throw new Error404()
      }

      orgResponse.rows[0].joinedAt = null
      orgResponse.rows[0].lastActive = null
      orgResponse.rows[0].activityCount = 0
      orgResponse.rows[0].memberCount = 0
      orgResponse.rows[0].avgContributorEngagement = null
      orgResponse.rows[0].activeOn = null
    }

    const organization = orgResponse.rows[0]

    const qx = SequelizeRepository.getQueryExecutor(options)
    const attributes = await findOrgAttributes(qx, id)
    organization.attributes = OrganizationRepository.convertOrgAttributesForDisplay(attributes)

    return organization
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

    if (segments.length !== 1) {
      throw new Error400(
        `This operation can have exactly one segment. Found ${segments.length} segments.`,
      )
    }

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

    if (isSegmentProjectGroup(segment)) {
      segments = (segment as SegmentProjectGroupNestedData).projects.reduce((acc, p) => {
        acc.push(...p.subprojects.map((sp) => sp.id))
        return acc
      }, [])
    } else if (isSegmentProject(segment)) {
      segments = (segment as SegmentProjectNestedData).subprojects.map((sp) => sp.id)
    } else {
      segments = [originalSegment]
    }

    const activeOrgsResults = await getActiveOrganizations(options.qdb, {
      timestampFrom: new Date(Date.parse(filter.activityTimestampFrom)),
      timestampTo: new Date(Date.parse(filter.activityTimestampTo)),
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

    const qx = SequelizeRepository.getQueryExecutor(options)
    const lfxMemberships = await findManyLfxMemberships(qx, {
      tenantId: options.currentTenant.id,
      organizationIds,
    })

    return {
      rows: organizations.rows.map((o) => {
        o.activityCount = organizationMap[o.id].activityCount.value
        o.activeDaysCount = organizationMap[o.id].activeDaysCount.value
        o.lfxMembership = lfxMemberships.find((m) => m.organizationId === o.id)
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
      orderBy = undefined,
      segmentId = undefined,
      fields = [...OrganizationRepository.QUERY_FILTER_COLUMN_MAP.keys()],
      include = {
        identities: true,
        lfxMemberships: true,
        segments: false,
        attributes: false,
      } as {
        aggregates?: boolean
        identities?: boolean
        lfxMemberships?: boolean
        segments?: boolean
        attributes?: boolean
      },
    },
    options: IRepositoryOptions,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)

    const qx = SequelizeRepository.getQueryExecutor(options, transaction)

    const withAggregates = include.aggregates

    // look for lfxMembership filter
    const lfxMembershipFilter = OrganizationRepository.findLfxMembershipInFilters(filter)
    let lfxMembershipFilterWhereClause = ''

    if (lfxMembershipFilter) {
      const filterKey = Object.keys(lfxMembershipFilter)[0]
      if (filterKey === 'ne') {
        lfxMembershipFilterWhereClause = `AND EXISTS (SELECT 1 FROM "lfxMemberships" lm WHERE lm."organizationId" = o.id AND lm."tenantId" = $(tenantId))`
      } else if (filterKey === 'eq') {
        lfxMembershipFilterWhereClause = `AND NOT EXISTS (SELECT 1 FROM "lfxMemberships" lm WHERE lm."organizationId" = o.id AND lm."tenantId" = $(tenantId))`
      }

      // remove lfxMembership filter from obj since filterParser doesn't support it
      filter.and = filter.and.filter((f) => !f.and?.some((subF) => subF.lfxMembership))
    }
    if (segmentId) {
      const segment = (await findSegmentById(optionsQx(options), segmentId)) as any

      if (segment === null) {
        options.log.info('No segment found for organization')
        return {
          rows: [],
          count: 0,
          limit,
          offset,
        }
      }

      segmentId = segment.id
    }

    const params = {
      limit,
      offset,
      segmentId,
      tenantId: options.currentTenant.id,
    }

    const filterString = RawQueryParser.parseFilters(
      filter,
      OrganizationRepository.QUERY_FILTER_COLUMN_MAP,
      [],
      params,
      { pgPromiseFormat: true },
    )

    const order = (function prepareOrderBy(
      orderBy = withAggregates ? 'lastActive_DESC' : 'id_DESC',
    ) {
      const orderSplit = orderBy.split('_')

      const orderField = OrganizationRepository.QUERY_FILTER_COLUMN_MAP.get(orderSplit[0])
      if (!orderField) {
        return withAggregates ? 'osa."lastActive" DESC' : 'o.id DESC'
      }
      const orderDirection = ['DESC', 'ASC'].includes(orderSplit[1]) ? orderSplit[1] : 'DESC'

      return `${orderField} ${orderDirection}`
    })(orderBy)

    const createQuery = (fields) => `
      SELECT
        ${fields}
      FROM organizations o
      ${
        withAggregates
          ? ` JOIN "organizationSegmentsAgg" osa ON osa."organizationId" = o.id AND ${
              segmentId ? `osa."segmentId" = $(segmentId)` : `osa."segmentId" IS NULL`
            }`
          : ''
      }
      WHERE 1=1
        AND o."tenantId" = $(tenantId)
        ${lfxMembershipFilterWhereClause}
        AND (${filterString})
    `

    const results = await Promise.all([
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
                .filter((f) => {
                  if (withAggregates) {
                    return true
                  }
                  return !f.startsWith('osa.')
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

    const rows = results[0]
    const count = parseInt(results[1].count, 10)

    const orgIds = rows.map((org) => org.id)
    if (orgIds.length === 0) {
      return { rows: [], count: 0, limit, offset }
    }

    if (include.lfxMemberships) {
      const lfxMemberships = await findManyLfxMemberships(qx, {
        organizationIds: orgIds,
        tenantId: options.currentTenant.id,
      })

      rows.forEach((org) => {
        org.lfxMembership = lfxMemberships.find((lm) => lm.organizationId === org.id)
      })
    }
    if (include.identities) {
      const identities = await fetchManyOrgIdentities(qx, orgIds, options.currentTenant.id)

      rows.forEach((org) => {
        org.identities = identities.find((i) => i.organizationId === org.id)?.identities || []
      })
    }
    if (include.segments) {
      const orgSegments = await fetchManyOrgSegments(qx, orgIds)

      rows.forEach((org) => {
        org.segments =
          orgSegments
            .find((i) => i.organizationId === org.id)
            ?.segments.filter((segment) => segment !== null) || []
      })
    }
    if (include.attributes) {
      const attributes = await findManyOrgAttributes(qx, orgIds)

      rows.forEach((org) => {
        org.attributes = attributes.find((a) => a.organizationId === org.id)?.attributes || []
      })
    }

    return { rows, count, limit, offset }
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
    const result = await queryActivities(options.qdb, {
      countOnly: true,
      tenantId: options.currentTenant.id,
      filter: {
        and: [
          {
            organizationId: {
              eq: organizationId,
            },
            platform: {
              eq: platform,
            },
          },
        ],
      },
    })

    return result.count
  }

  static async getMemberCountInPlatform(
    organizationId: string,
    platform: string,
    options: IRepositoryOptions,
  ): Promise<number> {
    const rows = await countMembersWithActivities(options.qdb, {
      tenantId: options.currentTenant.id,
      organizationId,
      platform,
    })

    let count = 0
    rows.forEach((row) => {
      count += Number(row.count)
    })

    return count
  }

  static async removeIdentitiesFromOrganization(
    organizationId: string,
    identities: IOrganizationIdentity[],
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)

    const seq = SequelizeRepository.getSequelize(options)

    const query = `
      delete from "organizationIdentities" where "organizationId" = :organizationId and platform = :platform and value = :value and type = :type;
    `

    for (const identity of identities) {
      await seq.query(query, {
        replacements: {
          organizationId,
          value: identity.value,
          type: identity.type,
          platform: identity.platform,
        },
        type: QueryTypes.DELETE,
        transaction,
      })
    }
  }
}

export default OrganizationRepository
