import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbActivity } from './activity.data'

export default class ActivityRepository extends RepositoryBase<ActivityRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  private readonly findExistingActivityQuery = `
    select id
           "memberId"
    from activities where "tenantId" = $(tenantId) and "sourceId" = $(sourceId)
  `
  public async findExistingActivity(
    tenantId: string,
    sourceId: string,
  ): Promise<IDbActivity | null> {
    const result = await this.db().oneOrNone(this.findExistingActivityQuery, {
      tenantId,
      sourceId,
    })

    return result
  }

  public async deleteActivity(id: string): Promise<void> {
    await this.db().none('delete from activities where id = $(id)', { id })
  }
}
