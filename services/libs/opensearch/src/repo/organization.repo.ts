import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbOrganizationSyncData, IOrganizationSegmentMatrix } from './organization.data'
import { IndexedEntityType } from './indexing.data'
import { IOrganizationSegment } from '@crowd/data-access-layer'

export class OrganizationRepository extends RepositoryBase<OrganizationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async getOrganizationData(organizationId: string): Promise<IDbOrganizationSyncData[]> {
    const results = await this.db().oneOrNone(
      `
          with identities as (select oi."organizationId",
                                jsonb_agg(oi) as "identities"
                          from "organizationIdentities" oi
                          where oi."organizationId" = $(organizationId)
                          group by oi."organizationId")
      select o.id                                                          as "organizationId",
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
            nullif(o."employeeChurnRate" -> '12_month', 'null')::decimal  as "employeeChurnRate12Month",
            nullif(o."employeeGrowthRate" -> '12_month', 'null')::decimal as "employeeGrowthRate12Month",
            coalesce(i.identities, '[]'::jsonb)                           as "identities"
      from organizations o
              left join identities i on o.id = i."organizationId"
      where o.id = $(organizationId)
        and o."deletedAt" is null;
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

  public async getOrganizationSegmentCouples(
    organizationIds: string[],
    orgSegmentCouples: IOrganizationSegment[],
    segmentIds?: string[],
  ): Promise<IOrganizationSegmentMatrix> {
    let organizationSegments: IOrganizationSegment[] = orgSegmentCouples

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
