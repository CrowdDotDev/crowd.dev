import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbOrganizationSyncData } from './organization.data'
import { IndexedEntityType } from './indexing.data'

export class OrganizationRepository extends RepositoryBase<OrganizationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async getOrganizationData(organizationId: string): Promise<IDbOrganizationSyncData> {
    const results = await this.db().oneOrNone(
      `
        WITH
            identities AS (
                SELECT
                    oi."organizationId",
                    JSONB_AGG(oi) AS "identities"
                FROM "organizationIdentities" oi
                WHERE oi."organizationId" = $(organizationId)
                GROUP BY oi."organizationId"
            ),
            aggs AS (
                SELECT
                    osa."organizationId",
                    SUM(osa."memberCount") AS "memberCount",
                    SUM(osa."activityCount") AS "activityCount",
                    ARRAY_AGG(DISTINCT ao."activeOn") AS "activeOn",
                    MAX(osa."lastActive") AS "lastActive",
                    MIN(osa."joinedAt") AS "joinedAt"
                FROM "organizationSegmentsAgg" osa
                CROSS JOIN LATERAL UNNEST(osa."activeOn") as ao("activeOn")
                WHERE osa."organizationId" = $(organizationId)
                GROUP BY osa."organizationId"
            )
        SELECT
            o.id AS "organizationId",
            o."tenantId",
            o.address,
            o.tags,
            o.ticker,
            o.attributes,
            o."createdAt",
            o."manuallyCreated",
            o.description,
            o."displayName",
            o.emails,
            o."employeeCountByCountry",
            o.employees,
            o.founded,
            o."geoLocation",
            o.headline,
            o."importHash",
            o.industry,
            o."isTeamOrganization",
            o."lastEnrichedAt",
            o.location,
            o.logo,
            o.naics,
            o."phoneNumbers",
            o.profiles,
            o."revenueRange",
            o.size,
            o.type,
            o.website,
            o.linkedin,
            o.github,
            o.crunchbase,
            o.twitter,
            o."affiliatedProfiles",
            o."allSubsidiaries",
            o."alternativeDomains",
            o."alternativeNames",
            o."averageEmployeeTenure",
            o."averageTenureByLevel",
            o."averageTenureByRole",
            o."directSubsidiaries",
            o."employeeChurnRate",
            o."employeeCountByMonth",
            o."employeeGrowthRate",
            o."employeeCountByMonthByLevel",
            o."employeeCountByMonthByRole",
            o."gicsSector",
            o."grossAdditionsByMonth",
            o."grossDeparturesByMonth",
            o."ultimateParent",
            o."immediateParent",
            o."weakIdentities",
            o."manuallyChangedFields",
            NULLIF(o."employeeChurnRate" -> '12_month', 'null')::DECIMAL AS "employeeChurnRate12Month",
            NULLIF(o."employeeGrowthRate" -> '12_month', 'null')::DECIMAL AS "employeeGrowthRate12Month",
            COALESCE(i.identities, '[]'::jsonb) AS "identities",
            a."memberCount",
            a."activityCount",
            a."activeOn",
            a."lastActive",
            a."joinedAt"
        FROM organizations o
        JOIN aggs a ON a."organizationId" = o.id
        LEFT JOIN identities i ON o.id = i."organizationId"
        WHERE o.id = $(organizationId)
          AND o."deletedAt" IS NULL
      `,
      {
        organizationId,
      },
    )

    return results
  }

  public async checkOrganizationsExists(tenantId: string, orgIds: string[]): Promise<string[]> {
    const results = await this.db().any(
      `
      select id
      from
        organizations
      where
        "tenantId" = $(tenantId) and
        id in ($(orgIds:csv)) and
        "deletedAt" is null
      `,
      {
        tenantId,
        orgIds,
      },
    )

    return results.map((r) => r.id)
  }

  public async getTenantOrganizationsForSync(tenantId: string, perPage: number): Promise<string[]> {
    const results = await this.db().any(
      `
      select o.id
      from organizations o
      left join indexed_entities ie on o.id = ie.entity_id and ie.type = $(type)
      where o."tenantId" = $(tenantId) and
            o."deletedAt" is null and
            ie.entity_id is null
      limit ${perPage}`,
      {
        tenantId,
        type: IndexedEntityType.ORGANIZATION,
      },
    )

    return results.map((r) => r.id)
  }

  public async getTenantIds(): Promise<string[]> {
    const results = await this.db().any(`select distinct "tenantId" from organizations;`)

    return results.map((r) => r.tenantId)
  }
}
