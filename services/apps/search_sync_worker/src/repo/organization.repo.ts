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
            left join activities a
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
