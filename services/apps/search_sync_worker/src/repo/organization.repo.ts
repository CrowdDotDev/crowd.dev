import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbOrganizationSyncData } from './organization.data'

export class OrganizationRepository extends RepositoryBase<OrganizationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async getOrganizationData(ids: string[]): Promise<IDbOrganizationSyncData[]> {
    const results = await this.db().any(
      `
        WITH organization_segments AS (
            SELECT
                "segmentId",
                "organizationId"
            FROM "organizationSegments"
            WHERE "organizationId" IN ($(ids:csv))
        ),
        to_merge_data AS (
            SELECT
                otm."organizationId",
                array_agg(DISTINCT otm."toMergeId"::text) AS to_merge_ids
            FROM "organizationToMerge" otm
            INNER JOIN organizations o2 ON otm."toMergeId" = o2.id
            WHERE otm."organizationId" IN ($(ids:csv))
              AND o2."deletedAt" IS NULL
            GROUP BY otm."organizationId"
        ),
        no_merge_data AS (
            SELECT
                onm."organizationId",
                array_agg(DISTINCT onm."noMergeId"::text) AS no_merge_ids
            FROM "organizationNoMerge" onm
            INNER JOIN organizations o2 ON onm."noMergeId" = o2.id
            WHERE onm."organizationId" IN ($(ids:csv))
              AND o2."deletedAt" IS NULL
            GROUP BY onm."organizationId"
        ),
        activities_1 AS (
            SELECT
                a.id,
                a."segmentId",
                a."organizationId",
                a."memberId",
                a.timestamp,
                a.platform::TEXT
            FROM mv_activities_cube a
            JOIN members m ON a."memberId" = m.id
                AND m."deletedAt" IS NULL
            JOIN "memberOrganizations" mo ON m.id = mo."memberId"
                AND a."organizationId" = mo."organizationId"
                AND mo."deletedAt" IS NULL
                AND mo."dateEnd" IS NULL
            WHERE a."organizationId" IN ($(ids:csv))
        ),
        member_data AS (
            SELECT
                os."segmentId",
                os."organizationId",
                count(DISTINCT a."memberId") AS "memberCount",
                count(DISTINCT a.id) AS "activityCount",
                CASE WHEN array_agg(DISTINCT a.platform) = ARRAY[NULL] THEN
                    ARRAY[]::text[]
                ELSE
                    array_agg(DISTINCT a.platform)
                END AS "activeOn",
                max(a.timestamp) AS "lastActive",
                min(a.timestamp) FILTER (WHERE a.timestamp <> '1970-01-01T00:00:00.000Z') AS "joinedAt"
            FROM organization_segments os
            LEFT JOIN activities_1 a ON a."organizationId" = os."organizationId"
              AND a."segmentId" = os."segmentId"
            GROUP BY os."segmentId", os."organizationId"
        ),
        identities AS (
            SELECT
                oi."organizationId",
                jsonb_agg(oi) AS "identities"
            FROM "organizationIdentities" oi
            WHERE oi."organizationId" IN ($(ids:csv))
            GROUP BY oi."organizationId"
        )
        SELECT
            o.id AS "organizationId",
            md."segmentId",
            o."tenantId",
            o.address,
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
            nullif (o."employeeChurnRate" -> '12_month', 'null')::decimal AS "employeeChurnRate12Month",
            nullif (o."employeeGrowthRate" -> '12_month', 'null')::decimal AS "employeeGrowthRate12Month",
            o.tags,
            md."joinedAt",
            md."lastActive",
            md."activeOn",
            md."activityCount",
            md."memberCount",
            i.identities,
            coalesce(tmd.to_merge_ids, array []::text[])       as "toMergeIds",
            coalesce(nmd.no_merge_ids, array []::text[])       as "noMergeIds",
            o."weakIdentities"
        FROM organizations o
        LEFT JOIN member_data md ON o.id = md."organizationId"
        LEFT JOIN identities i ON o.id = i."organizationId"
        WHERE o.id IN ($(ids:csv))
          AND o."deletedAt" IS NULL
          AND (md."organizationId" IS NOT NULL
              OR o."manuallyCreated");
      `,
      {
        ids,
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

  public async markSynced(orgIds: string[]): Promise<void> {
    await this.db().none(
      `update organizations set "searchSyncedAt" = now() where id in ($(orgIds:csv))`,
      {
        orgIds,
      },
    )
  }

  public async getTenantOrganizationsForSync(
    tenantId: string,
    page: number,
    perPage: number,
    cutoffDate: string,
  ): Promise<string[]> {
    const results = await this.db().any(
      `
        select o.id
        from organizations o
        where o."tenantId" = $(tenantId) and 
              o."deletedAt" is null and
              (
                  o."searchSyncedAt" is null or 
                  o."searchSyncedAt" < $(cutoffDate)
              ) 
        limit ${perPage} offset ${(page - 1) * perPage};`,
      {
        tenantId,
        cutoffDate,
      },
    )

    return results.map((r) => r.id)
  }

  public async getTenantIds(): Promise<string[]> {
    const results = await this.db().any(`select distinct "tenantId" from organizations;`)

    return results.map((r) => r.tenantId)
  }
}
