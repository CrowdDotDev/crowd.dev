import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbOrganizationSyncData, IOrganizationSegmentMatrix } from './organization.data'

export class OrganizationRepository extends RepositoryBase<OrganizationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async getOrganizationData(ids: string[]): Promise<IDbOrganizationSyncData[]> {
    const results = await this.db().any(
      `
      with 
        organization_segments as (
          select "segmentId", "organizationId"
          from "organizationSegments"
          where "organizationId" in ($(ids:csv))
        ),
        member_data as (
            select os."segmentId",
            os."organizationId",
            count(distinct a."memberId")                                               as "memberCount",
            count(distinct a.id)                                                       as "activityCount",
            case
                when array_agg(distinct a.platform) = array [null] then array []::text[]
                else array_agg(distinct a.platform) end                                as "activeOn",
            max(a.timestamp)                                                           as "lastActive",
            min(a.timestamp) filter ( where a.timestamp <> '1970-01-01T00:00:00.000Z') as "joinedAt"
            from organization_segments os
            join activities a
                      on a."organizationId" = os."organizationId" 
                          and a."segmentId" = os."segmentId" and a."deletedAt" is null
            join members m on a."memberId" = m.id and m."deletedAt" is null
            join "memberOrganizations" mo
                      on m.id = mo."memberId"
                          and a."organizationId" = mo."organizationId"
                          and mo."deletedAt" is null
                          and mo."dateEnd" is null
            group by os."segmentId", os."organizationId"
        ),
        identities as (
            select oi."organizationId", jsonb_agg(oi) as "identities"
            from "organizationIdentities" oi
            where oi."organizationId" in ($(ids:csv))
            group by oi."organizationId"
        )
    select 
        o.id as "organizationId",
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
        md."joinedAt",
        md."lastActive",
        md."activeOn",
        md."activityCount",
        md."memberCount",
        i.identities
        from organizations o
        left join member_data md on o.id = md."organizationId"
        left join identities i on o.id = i."organizationId"
        where o.id in ($(ids:csv))
        and o."deletedAt" is null
        and (md."organizationId" is not null or o."manuallyCreated");
      `,
      {
        ids,
      },
    )

    return results
  }

  public async getOrganizationDataInOneSegment(
    organizationId: string,
    segmentId: string,
  ): Promise<IDbOrganizationSyncData[]> {
    const results = await this.db().oneOrNone(
      `
      WITH organization_segments AS (
        SELECT
          $(segmentId)::uuid AS "segmentId",
          $(organizationId)::uuid AS "organizationId"
    ),
    to_merge_data AS (
        SELECT
            otm."organizationId",
            array_agg(DISTINCT otm."toMergeId"::text) AS to_merge_ids
        FROM "organizationToMerge" otm
        INNER JOIN organizations o2 ON otm."toMergeId" = o2.id
        WHERE otm."organizationId" = $(organizationId)
          AND o2."deletedAt" IS NULL
        GROUP BY otm."organizationId"
    ),
    no_merge_data AS (
        SELECT
            onm."organizationId",
            array_agg(DISTINCT onm."noMergeId"::text) AS no_merge_ids
        FROM "organizationNoMerge" onm
        INNER JOIN organizations o2 ON onm."noMergeId" = o2.id
        WHERE onm."organizationId" = $(organizationId)
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
        FROM activities a
        JOIN members m ON a."memberId" = m.id
            AND m."deletedAt" IS NULL
        JOIN "memberOrganizations" mo ON m.id = mo."memberId"
            AND a."organizationId" = mo."organizationId"
            AND mo."deletedAt" IS NULL
        WHERE a."organizationId" = $(organizationId)
    ),
    member_data AS (
        SELECT
            os."segmentId",
            os."organizationId",
            array_agg(distinct a."memberId") as "memberIds",
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
        WHERE oi."organizationId" = $(organizationId)
        GROUP BY oi."organizationId"
    )
    SELECT
        o.id AS "organizationId",
        md."segmentId",
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
        nullif (o."employeeChurnRate" -> '12_month', 'null')::decimal AS "employeeChurnRate12Month",
        nullif (o."employeeGrowthRate" -> '12_month', 'null')::decimal AS "employeeGrowthRate12Month",
        o.tags,
        md."joinedAt",
        md."lastActive",
        md."activeOn",
        md."activityCount"::integer,
        md."memberCount"::integer,
        md."memberIds",
        i.identities,
        coalesce(tmd.to_merge_ids, array []::text[])       as "toMergeIds",
        coalesce(nmd.no_merge_ids, array []::text[])       as "noMergeIds",
        o."weakIdentities"
    FROM organizations o
    LEFT JOIN member_data md ON o.id = md."organizationId"
    LEFT JOIN identities i ON o.id = i."organizationId"
    LEFT JOIN to_merge_data tmd on o.id = tmd."organizationId"
    LEFT JOIN no_merge_data nmd on o.id = nmd."organizationId"
    WHERE o.id = $(organizationId)
      AND o."deletedAt" IS NULL
      AND (md."organizationId" IS NOT NULL
          OR o."manuallyCreated");
      `,
      {
        organizationId,
        segmentId,
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

  public async getOrganizationSegmentCouples(ids): Promise<IOrganizationSegmentMatrix> {
    const results = await this.db().any(
      `
      select distinct a."segmentId", a."organizationId"
      from activities a
      where a."organizationId" in ($(ids:csv));
      `,
      {
        ids,
      },
    )

    const matrix = {}

    for (const orgSegment of results) {
      if (!matrix[orgSegment.organizationId]) {
        matrix[orgSegment.organizationId] = [
          {
            segmentId: orgSegment.segmentId,
          },
        ]
      } else {
        matrix[orgSegment.organizationId].push({
          segmentId: orgSegment.segmentId,
        })
      }
    }

    return matrix
  }
}
