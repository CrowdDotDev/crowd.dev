import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbActivityId } from './activity.data'

export class ActivityRepository extends RepositoryBase<ActivityRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async checkActivitiesExist(activityIds: string[]): Promise<IDbActivityId[]> {
    const results = await this.db().any(
      `
      select id
      from activities where id in ($(activityIds:csv)) and "deletedAt" is null
    `,
      {
        activityIds,
      },
    )

    return results
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
