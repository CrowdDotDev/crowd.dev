import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  IDbOrganizationSyncData,
  IOrganizationSegment,
  IOrganizationSegmentMatrix,
} from './organization.data'
import { IndexedEntityType } from './indexing.data'

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
    activities_1 AS (
        SELECT
            a.id,
            a."segmentId",
            a."organizationId",
            a."memberId",
            a.timestamp,
            a.platform::TEXT
        FROM activities a
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
        o."weakIdentities",
        o."manuallyChangedFields",
        nullif (o."employeeChurnRate" -> '12_month', 'null')::decimal AS "employeeChurnRate12Month",
        nullif (o."employeeGrowthRate" -> '12_month', 'null')::decimal AS "employeeGrowthRate12Month",
        o.tags,
        md."joinedAt",
        md."lastActive",
        md."activeOn",
        md."activityCount"::integer,
        md."memberCount"::integer,
        md."memberIds",
        coalesce(i.identities, '[]'::jsonb)            as "identities"
    FROM organizations o
    LEFT JOIN member_data md ON o.id = md."organizationId"
    LEFT JOIN identities i ON o.id = i."organizationId"
    WHERE o.id = $(organizationId)
      AND o."deletedAt" IS NULL;
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

  public async getOrganizationSegmentCouples(
    organizationIds: string[],
    segmentIds?: string[],
  ): Promise<IOrganizationSegmentMatrix> {
    let organizationSegments: IOrganizationSegment[] = []
    if (segmentIds && segmentIds.length > 0) {
      for (const organizationId of organizationIds) {
        for (const segmentId of segmentIds) {
          organizationSegments.push({
            organizationId,
            segmentId,
          })
        }
      }
    } else {
      organizationSegments = await this.db().any(
        `
        SELECT * FROM organization_segments_mv
        WHERE "organizationId" in ($(ids:csv));
        `,
        {
          ids: organizationIds,
        },
      )
      // Manually created organizations don't have any activities,
      // filter out those organizationIds that are not in the results
      const manuallyCreatedIds = organizationIds.filter(
        (id) => !organizationSegments.some((r) => r.organizationId === id),
      )
      if (manuallyCreatedIds.length > 0) {
        const missingResults = await this.db().any(
          `
          select distinct os."segmentId", os."organizationId"
          from "organizationSegments" os
          where os."organizationId" in ($(manuallyCreatedIds:csv));
          `,
          {
            manuallyCreatedIds,
          },
        )
        organizationSegments = [...organizationSegments, ...missingResults]
      }
    }

    const matrix = {}

    for (const orgSegment of organizationSegments) {
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
