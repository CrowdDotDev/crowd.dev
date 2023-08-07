import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbOrganizationSyncData } from './organization.data'

export class OrganizationRepository extends RepositoryBase<OrganizationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async getOrganizationData(
    ids: string[],
    tenantId: string,
  ): Promise<IDbOrganizationSyncData[]> {
    const results = await this.db().any(
      `
      with organization_segments as (select "segmentId", "organizationId"
                                            from "organizationSegments"
                                            where "organizationId" in ($(ids:csv))
                                              and "tenantId" = $(tenantId)),
                  member_data as (select os."segmentId",
                                          os."organizationId",
                                          count(distinct m.id)                                                        as "memberCount",
                                          count(distinct a.id)                                                        as "activityCount",
                                          array_agg(distinct a.platform)                                              as "activeOn",
                                          max(a.timestamp)                                                            as "lastActive",
                                          array_agg(distinct mi.platform)                                             as "identities",
                                          min(a.timestamp) filter ( where a.timestamp <> '1970-01-01T00:00:00.000Z' ) as "joinedAt"
                                  from members m
                                            inner join "memberIdentities" mi on mi."memberId" = m.id
                                            inner join "memberSegments" ms on m.id = ms."memberId"
                                            inner join "memberOrganizations" mo on m.id = mo."memberId"
                                            inner join organization_segments os on os."organizationId" = mo."organizationId" and
                                                                                  os."segmentId" = ms."segmentId"
                                            inner join activities a
                                                      on ms."memberId" = a."memberId" and ms."segmentId" = a."segmentId" and
                                                          a."deletedAt" is null

                                  where m."tenantId" = $(tenantId)
                                    and m."deletedAt" is null
                                  group by os."segmentId", os."organizationId")
              select o.id,
                    md."segmentId",
                    o."tenantId",
                    o.address,
                    o.attributes,
                    o."createdAt",
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
                    o.name,
                    o."parentUrl",
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
              where o.id in ($(ids:csv)) and o."tenantId" = $(tenantId) and o."deletedAt" is null;
      `,
      {
        ids,
        tenantId,
      },
    )

    return results
  }
}
