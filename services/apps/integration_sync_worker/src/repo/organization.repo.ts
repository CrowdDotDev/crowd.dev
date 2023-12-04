import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { generateUUIDv1 as uuid } from '@crowd/common'
import {
  IOrganization,
  IOrganizationSyncRemoteData,
  JsonColumnInfo,
  SyncStatus,
} from '@crowd/types'
import { IOrganizationIdWithAttributes } from './organization.data'
import { RawQueryParser } from '@crowd/common'

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

  public async setIntegrationSourceId(
    organizationId: string,
    integrationId: string,
    sourceId: string,
  ): Promise<void> {
    this.log.debug(
      `Updating organization ${organizationId} in integration ${integrationId} sourceId to ${sourceId}.`,
    )

    await this.db().none(
      `update "organizationsSyncRemote" set "sourceId" = $(sourceId) where "organizationId" = $(organizationId) and "integrationId" = $(integrationId)`,
      {
        organizationId,
        integrationId,
        sourceId,
      },
    )
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

  public async findMarkedOrganizations(
    integrationId: string,
    limit: number,
    offset: number,
  ): Promise<IOrganizationSyncRemoteData[]> {
    const results = await this.db().any(
      `select distinct "organizationId", "sourceId"
        from "organizationsSyncRemote"
        where status = $(status)
        and "integrationId" = $(integrationId)
        and "organizationId" is not null
        order by "organizationId", "sourceId"
        limit $(limit) offset $(offset)`,
      {
        integrationId,
        limit,
        offset,
        status: SyncStatus.ACTIVE,
      },
    )
    return results
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

  public async findFilteredOrganizations(
    tenantId: string,
    segmentIds: string[],
    platform: string,
    filter: unknown,
    limit: number,
    offset: number,
  ) {
    const params: unknown = {
      tenantId,
      segmentIds,
      limit,
      offset,
    }

    const jsonColumnInfos: JsonColumnInfo[] = []

    let filterString = RawQueryParser.parseFilters(
      filter,
      OrganizationRepository.ORGANIZATION_QUERY_FILTER_COLUMN_MAP,
      jsonColumnInfos,
      params,
    )

    if (filterString.trim().length === 0 || filterString === '()') {
      filterString = '1=1'
    } else {
      filterString = OrganizationRepository.replaceParametersWithDollarSign(filterString)
    }

    const query = `
            with orgAggregates as (select memOrgs."organizationId",
            count(actAgg.id)            as "memberCount",
            SUM(actAgg."activityCount") as "activityCount"
        from "memberActivityAggregatesMVs" actAgg
              inner join "memberOrganizations" memOrgs
                 on actAgg."id" = memOrgs."memberId"
                 and memOrgs."deletedAt" is null
        group by memOrgs."organizationId")
        select org.*,
        oa."activityCount",
        oa."memberCount"
        from organizations as org
        inner join orgAggregates oa on oa."organizationId" = org.id
        where org."deletedAt" is null
        and coalesce((org.attributes -> 'syncRemote' -> '${platform}')::boolean, false) = false 
        and org."tenantId" = $(tenantId)
        and ${filterString}
        order by org.name desc
        limit $(limit) offset $(offset);
    `

    this.log.trace({ query }, 'Generated sql query from advanced filters!')

    const results = await this.db().any(query, params)

    return results
  }

  public async findSyncRemoteById(syncRemoteId: string): Promise<IOrganizationSyncRemoteData> {
    return await this.db().oneOrNone(
      `select * from "organizationsSyncRemote" where id = $(syncRemoteId)`,
      { syncRemoteId },
    )
  }

  public async setSyncRemoteSourceId(syncRemoteId: string, sourceId: string): Promise<void> {
    this.log.debug(`Updating syncRemote ${syncRemoteId} sourceId to ${sourceId}.`)

    await this.db().none(
      `update "organizationsSyncRemote" set "sourceId" = $(sourceId) where id = $(syncRemoteId)`,
      {
        syncRemoteId,
        sourceId,
      },
    )
  }

  public async setLastSyncedAtBySyncRemoteId(
    syncRemoteId: string,
    lastSyncedPayload: unknown,
  ): Promise<void> {
    this.log.debug(`Setting lastSyncedAt for id ${syncRemoteId}.`)

    await this.db().none(
      `update "organizationsSyncRemote" set "lastSyncedAt" = now(), "status" = $(status), "lastSyncedPayload" = $(lastSyncedPayload) where id = $(syncRemoteId)`,
      {
        syncRemoteId,
        lastSyncedPayload: JSON.stringify(lastSyncedPayload),
        status: SyncStatus.ACTIVE,
      },
    )
  }

  public async setLastSyncedAt(
    organizationId: string,
    integrationId: string,
    lastSyncedPayload: unknown,
  ): Promise<void> {
    this.log.debug(
      `Setting lastSyncedAt for organization ${organizationId} and integration ${integrationId} to now!`,
    )

    await this.db().none(
      `update "organizationsSyncRemote" set "lastSyncedAt" = now(), "status" = $(status), "lastSyncedPayload" = $(lastSyncedPayload) where "organizationId" = $(organizationId) and "integrationId" = $(integrationId) and status <> $(neverStatus)`,
      {
        organizationId,
        integrationId,
        lastSyncedPayload: JSON.stringify(lastSyncedPayload),
        status: SyncStatus.ACTIVE,
        neverStatus: SyncStatus.NEVER,
      },
    )
  }

  public async findSyncRemote(
    organizationId: string,
    integrationId: string,
    syncFrom: string,
  ): Promise<IOrganizationSyncRemoteData> {
    return await this.db().oneOrNone(
      `select * from "organizationsSyncRemote" where "organizationId" = $(organizationId) and "integrationId" = $(integrationId) and "syncFrom" = $(syncFrom)`,
      {
        organizationId,
        integrationId,
        syncFrom,
      },
    )
  }

  public async findSyncRemoteByOrganizationId(
    organizationId: string,
  ): Promise<IOrganizationSyncRemoteData> {
    return await this.db().oneOrNone(
      `SELECT *
      FROM "organizationsSyncRemote"
      WHERE "organizationId" = $(organizationId)
      and "sourceId" is not null
      limit 1;`,
      { organizationId },
    )
  }

  public async markOrganizationForSyncing(
    data: IOrganizationSyncRemoteData,
  ): Promise<IOrganizationSyncRemoteData> {
    const existingSyncRemote = await this.findSyncRemoteByOrganizationId(data.organizationId)

    if (existingSyncRemote) {
      data.sourceId = existingSyncRemote.sourceId
    }

    this.log.debug({ data }, 'Marking organization for sync! ')

    const id = await this.db()
      .one(
        `insert into "organizationsSyncRemote" ("id", "organizationId", "sourceId", "integrationId", "syncFrom", "metaData", "lastSyncedAt", "status")
      values
          ($(id), $(organizationId), $(sourceId), $(integrationId), $(syncFrom), $(metaData), $(lastSyncedAt), $(status))
      returning "id"
    `,
        {
          id: uuid(),
          organizationId: data.organizationId,
          integrationId: data.integrationId,
          syncFrom: data.syncFrom,
          metaData: data.metaData || null,
          lastSyncedAt: data.lastSyncedAt || null,
          sourceId: data.sourceId || null,
          status: SyncStatus.ACTIVE,
        },
      )
      .then((data) => data.id)

    this.log.debug(`Inserted organizationSyncRemote with id ${id}`)

    return this.findSyncRemoteById(id)
  }
}
