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
      with organization_segments as (select "segmentId", "organizationId"
                                    from "organizationSegments"
                                    where "organizationId" in ($(ids:csv))),
          member_data as (select os."segmentId",
                                  os."organizationId",
                                  count(distinct m.id)                                                        as "memberCount",
                                  count(distinct a.id)                                                        as "activityCount",
                                  case
                                      when array_agg(distinct a.platform) = array [null] then array []::text[]
                                      else array_agg(distinct a.platform) end                                 as "activeOn",
                                  max(a.timestamp)                                                            as "lastActive",
                                  case
                                      when array_agg(distinct mi.platform) = array [null] then array []::text[]
                                      else array_agg(distinct mi.platform) end                                as "identities",
                                  min(a.timestamp) filter ( where a.timestamp <> '1970-01-01T00:00:00.000Z' ) as "joinedAt"
                          from organization_segments os
                                    left join activities a
                                              on a."organizationId" = os."organizationId" and
                                                a."segmentId" = os."segmentId" and a."deletedAt" is null
                                    left join members m on a."memberId" = m.id and m."deletedAt" is null
                                    left join "memberIdentities" mi on m.id = mi."memberId"
                          group by os."segmentId", os."organizationId")
      select o.id as "organizationId",
            md."segmentId",
            o."tenantId",
            o.address,
            o.attributes,
            o."createdAt",
            o.description,
            COALESCE(o."displayName", o.name) as "displayName",
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
            o.name,
            o."phoneNumbers",
            o.profiles,
            o."revenueRange",
            o.size,
            o.type,
            o.url,
            o.website,
            o.linkedin,
            o.github,
            o.crunchbase,
            o.twitter,
            md."joinedAt",
            md."lastActive",
            md."activeOn",
            md."activityCount",
            md."memberCount",
            md.identities
      from member_data md
              inner join organizations o on o.id = md."organizationId"
      where o.id in ($(ids:csv))
        and o."deletedAt" is null;
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
