import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbActivitySyncData } from './activity.data'
import { IndexedEntityType } from './indexing.data'

export class ActivityRepository extends RepositoryBase<ActivityRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async getActivityData(activityIds: string[]): Promise<IDbActivitySyncData[]> {
    const results = await this.db().any(
      `
      select id,
            "tenantId",
            "segmentId",
            type,
            timestamp,
            platform,
            "isContribution",
            score,
            "sourceId",
            "sourceParentId",
            channel,
            body,
            title,
            url,
            (sentiment -> 'sentiment')::int as sentiment,
            "importHash",
            "memberId",
            "conversationId",
            "parentId",
            username,
            "objectMemberId",
            "objectMemberUsername",
            "organizationId"
      from activities where id in ($(activityIds:csv)) and "deletedAt" is null
    `,
      {
        activityIds,
      },
    )

    return results
  }

  public async checkActivitiesExist(tenantId: string, activityIds: string[]): Promise<string[]> {
    const results = await this.db().any(
      `
      select id from activities where "tenantId" = $(tenantId) and id in ($(activityIds:csv)) and "deletedAt" is null
    `,
      {
        tenantId,
        activityIds,
      },
    )

    return results.map((r) => r.id)
  }

  public async getTenantActivitiesForSync(tenantId: string, perPage: number): Promise<string[]> {
    const results = await this.db().any(
      `
      select id from activities a
      left join indexed_entities ie on 
        a.id = ie.entity_id and ie.type = $(type)
      where a."tenantId" = $(tenantId) and a."deletedAt" is null and ie.entity_id is null
      limit ${perPage}
      `,
      {
        tenantId,
        type: IndexedEntityType.ACTIVITY,
      },
    )

    return results.map((r) => r.id)
  }

  public async getOrganizationActivitiesForSync(
    organizationId: string,
    perPage: number,
    lastId?: string,
  ): Promise<string[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let results: any[]

    if (lastId) {
      results = await this.db().any(
        `
      select id from activities 
      where "organizationId" = $(organizationId) and "deletedAt" is null and id > $(lastId)
      order by id
      limit ${perPage};
      `,
        {
          organizationId,
          lastId,
        },
      )
    } else {
      results = await this.db().any(
        `
      select id from activities 
      where "organizationId" = $(organizationId) and "deletedAt" is null
      order by id
      limit ${perPage};
      `,
        {
          organizationId,
        },
      )
    }

    return results.map((r) => r.id)
  }

  public async getRemainingTenantActivitiesForSync(
    tenantId: string,
    page: number,
    perPage: number,
    cutoffDate: string,
  ): Promise<string[]> {
    const results = await this.db().any(
      `
      select id from activities 
      where "tenantId" = $(tenantId) and "deletedAt" is null
       and (
        "searchSyncedAt" is null or
        "searchSyncedAt" < $(cutoffDate)
       )
      limit ${perPage} offset ${(page - 1) * perPage};
      `,
      {
        tenantId,
        cutoffDate,
      },
    )

    return results.map((r) => r.id)
  }

  public async getTenantIds(): Promise<string[]> {
    const results = await this.db().any(
      `select "tenantId" 
       from activities
        where "deletedAt" is null
       group by "tenantId"
       order by count(id) asc`,
    )

    return results.map((r) => r.tenantId)
  }
}
