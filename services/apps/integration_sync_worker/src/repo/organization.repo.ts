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

  public async findOrganization(organizationId: string, tenantId: string): Promise<IOrganization> {
    return await this.db().oneOrNone(
      `
      WITH
      activity_counts AS (
          SELECT mo."organizationId", COUNT(a.id) AS "activityCount"
          FROM "memberOrganizations" mo
          LEFT JOIN activities a ON a."memberId" = mo."memberId"
          WHERE mo."organizationId" = $(organizationId)
          GROUP BY mo."organizationId"
      ),
      member_counts AS (
          SELECT "organizationId", COUNT(DISTINCT "memberId") AS "memberCount"
          FROM "memberOrganizations"
          WHERE "organizationId" = $(organizationId)
          GROUP BY "organizationId"
      ),
      active_on AS (
          SELECT mo."organizationId", ARRAY_AGG(DISTINCT platform) AS "activeOn"
          FROM "memberOrganizations" mo
          JOIN activities a ON a."memberId" = mo."memberId"
          WHERE mo."organizationId" = $(organizationId)
          GROUP BY mo."organizationId"
      ),
      identities AS (
          SELECT "organizationId", ARRAY_AGG(DISTINCT platform) AS "identities"
          FROM "memberOrganizations" mo
          JOIN "memberIdentities" mi ON mi."memberId" = mo."memberId"
          WHERE mo."organizationId" = $(organizationId)
          GROUP BY "organizationId"
      ),
      last_active AS (
          SELECT mo."organizationId", MAX(timestamp) AS "lastActive", MIN(timestamp) AS "joinedAt"
          FROM "memberOrganizations" mo
          JOIN activities a ON a."memberId" = mo."memberId"
          WHERE mo."organizationId" = $(organizationId)
          GROUP BY mo."organizationId"
      ),
      segments AS (
          SELECT "organizationId", ARRAY_AGG("segmentId") AS "segments"
          FROM "organizationSegments"
          WHERE "organizationId" = $(organizationId)
          GROUP BY "organizationId"
      )
  SELECT
      o.*,
      COALESCE(ac."activityCount", 0)::INTEGER AS "activityCount",
      COALESCE(mc."memberCount", 0)::INTEGER AS "memberCount",
      COALESCE(ao."activeOn", '{}') AS "activeOn",
      COALESCE(id."identities", '{}') AS "identities",
      COALESCE(s."segments", '{}') AS "segments",
      a."lastActive",
      a."joinedAt"
  FROM organizations o
  LEFT JOIN activity_counts ac ON ac."organizationId" = o.id
  LEFT JOIN member_counts mc ON mc."organizationId" = o.id
  LEFT JOIN active_on ao ON ao."organizationId" = o.id
  LEFT JOIN identities id ON id."organizationId" = o.id
  LEFT JOIN last_active a ON a."organizationId" = o.id
  LEFT JOIN segments s ON s."organizationId" = o.id
  WHERE o.id = $(organizationId)
    AND o."tenantId" = $(tenantId);`,
      {
        organizationId,
        tenantId,
      },
    )
  }

  public async findFilteredOrganizations(
    tenantId: string,
    segmentIds: string[],
    platform: string,
    filter: any,
    limit: number,
    offset: number,
  ) {
    const params: any = {
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

    if (filterString.trim().length === 0) {
      filterString = '1=1'
    } else {
      filterString = OrganizationRepository.replaceParametersWithDollarSign(filterString)
    }

    const query = `
            with orgAggregates as (select memOrgs."organizationId",
            count(actAgg.id)            as "memberCount",
            SUM(actAgg."activityCount") as "activityCount"
        from "memberActivityAggregatesMVs" actAgg
              inner join "memberOrganizations" memOrgs on actAgg."id" = memOrgs."memberId"
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

  public async setLastSyncedAtBySyncRemoteId(syncRemoteId: string): Promise<void> {
    this.log.debug(`Setting lastSyncedAt for id ${syncRemoteId}.`)

    await this.db().none(
      `update "organizationsSyncRemote" set "lastSyncedAt" = now(), "status" = $(status) where id = $(syncRemoteId)`,
      {
        syncRemoteId,
        status: SyncStatus.ACTIVE,
      },
    )
  }

  public async setLastSyncedAt(organizationId: string, integrationId: string): Promise<void> {
    this.log.debug(
      `Setting lastSyncedAt for organization ${organizationId} and integration ${integrationId} to now!`,
    )

    await this.db().none(
      `update "organizationsSyncRemote" set "lastSyncedAt" = now(), "status" = $(status) where "organizationId" = $(organizationId) and "integrationId" = $(integrationId) and status <> $(neverStatus)`,
      {
        organizationId,
        integrationId,
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
