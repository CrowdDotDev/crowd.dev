import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IOrganization } from '@crowd/types'

import { IOrganizationIdWithAttributes } from './organization.data'

export class OrganizationRepository extends RepositoryBase<OrganizationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public static ORGANIZATION_QUERY_FILTER_COLUMN_MAP: Map<string, string> = new Map([
    ['activityCount', 'oa."activityCount"'],
    ['memberCount', 'oa."memberCount"'],
    ['size', 'org.size'],
    ['industry', 'org.industry'],
    ['revenueRange', `(org."revenueRange" -> 'max')::integer`],
    ['revenueRangeMin', `nullif(org."revenueRange" -> 'min', 'null')::integer`],
    ['revenueRangeMax', `nullif(org."revenueRange" -> 'max', 'null')::integer`],
    ['employeeChurnRate12Month', `nullif(o."employeeChurnRate" -> '12_month', 'null')::decimal`],
    ['employeeGrowthRate12Month', `nullif(o."employeeGrowthRate" -> '12_month', 'null')::decimal`],
  ])

  public static replaceParametersWithDollarSign(inputString) {
    return inputString.replace(/(?<!:):([\w.]+)/g, '$($1)')
  }

  public async findOrganizationAttributes(
    organizationId: string,
  ): Promise<IOrganizationIdWithAttributes> {
    return await this.db().oneOrNone(
      `select id, attributes from organizations where id = $(organizationId)`,
      {
        organizationId,
      },
    )
  }

  public async findOrganization(
    organizationId: string,
    tenantId: string,
    segmentId: string,
  ): Promise<IOrganization> {
    const segmentsSubQuery = `
    with input_segment as (select id,
                                  slug,
                                  "parentSlug",
                                  "grandparentSlug"
                          from segments
                          where id = $(segmentId)
                            and "tenantId" = $(tenantId)),
                          segment_level as (select case
                                      when "parentSlug" is not null and "grandparentSlug" is not null
                                          then 'child'
                                      when "parentSlug" is not null and "grandparentSlug" is null
                                          then 'parent'
                                      when "parentSlug" is null and "grandparentSlug" is null
                                          then 'grandparent'
                                      end as level,
                                  id,
                                  slug,
                                  "parentSlug",
                                  "grandparentSlug"
                          from input_segment)
                          select s.id
                          from segments s
                          join
                          segment_level sl
                          on
                          (sl.level = 'child' and s.id = sl.id) or
                          (sl.level = 'parent' and s."parentSlug" = sl.slug and s."grandparentSlug" is not null) or
                          (sl.level = 'grandparent' and s."grandparentSlug" = sl.slug)`

    return await this.db().oneOrNone(
      `
      with leaf_segment_ids as (${segmentsSubQuery}),
      member_data as (select a."organizationId",
          count(distinct a."memberId")                                                        as "memberCount",
          count(distinct a.id)                                                        as "activityCount",
          case
              when array_agg(distinct a.platform) = array [null] then array []::text[]
              else array_agg(distinct a.platform) end                                 as "activeOn",
          max(a.timestamp)                                                            as "lastActive",
          min(a.timestamp) filter ( where a.timestamp <> '1970-01-01T00:00:00.000Z' ) as "joinedAt"
      from leaf_segment_ids ls
            join activities a
                      on a."segmentId" = ls.id and a."organizationId" = $(id) and
                        a."deletedAt" is null
            join members m on a."memberId" = m.id and m."deletedAt" is null
            join "memberOrganizations" mo on m.id = mo."memberId" and mo."organizationId" = $(id) and mo."dateEnd" is null
      group by a."organizationId"),
      organization_segments as (select "organizationId", array_agg("segmentId") as "segments"
            from "organizationSegments"
            where "organizationId" = $(id)
            group by "organizationId"),
      identities as (
        SELECT oi."organizationId", jsonb_agg(oi) AS "identities"
        FROM "organizationIdentities" oi
        WHERE oi."organizationId" = $(id)
        GROUP BY "organizationId"
      )
      select 
        o.*,
        nullif(o."employeeChurnRate" -> '12_month', 'null')::decimal as "employeeChurnRate12Month",
        nullif(o."employeeGrowthRate" -> '12_month', 'null')::decimal as "employeeGrowthRate12Month",
        nullif(o."revenueRange" -> 'min', 'null')::integer as "revenueRangeMin",
        nullif(o."revenueRange" -> 'max', 'null')::integer as "revenueRangeMax",
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
      where o.id = $(id)
      and o."tenantId" = $(tenantId);
  `,
      {
        id: organizationId,
        tenantId,
        segmentId,
      },
    )
  }
}
