import { generateUUIDv1 } from '@crowd/common'
import { DbColumnSet, DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  IDbActivity,
  IDbActivityCreateData,
  IDbActivityUpdateData,
  getInsertActivityColumnSet,
  getUpdateActivityColumnSet,
} from './activity.data'

export default class ActivityRepository extends RepositoryBase<ActivityRepository> {
  private readonly insertActivityColumnSet: DbColumnSet
  private readonly updateActivityColumnSet: DbColumnSet

  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)

    this.insertActivityColumnSet = getInsertActivityColumnSet(this.dbInstance)
    this.updateActivityColumnSet = getUpdateActivityColumnSet(this.dbInstance)
  }

  private readonly findExistingActivityQuery = `
    select  id,
            type,
            timestamp,
            "isContribution",
            score,
            "sourceId",
            "sourceParentId",
            "parentId",
            "memberId",
            username,
            attributes,
            body,
            title,
            channel,
            url,
            sentiment
    from activities where "tenantId" = $(tenantId) and "sourceId" = $(sourceId)
  `
  public async findExisting(tenantId: string, sourceId: string): Promise<IDbActivity | null> {
    const result = await this.db().oneOrNone(this.findExistingActivityQuery, {
      tenantId,
      sourceId,
    })

    return result
  }

  public async delete(id: string): Promise<void> {
    await this.db().none('delete from activities where id = $(id)', { id })
  }

  public async create(tenantId: string, data: IDbActivityCreateData): Promise<string> {
    const id = generateUUIDv1()
    const ts = new Date()
    const prepared = RepositoryBase.prepare(
      { ...data, id, tenantId, createdAt: ts, updatedAt: ts },
      this.insertActivityColumnSet,
    )
    const query = this.dbInstance.helpers.insert(prepared, this.insertActivityColumnSet)

    await this.db().none(query)
    return id
  }

  public async update(id: string, tenantId: string, data: IDbActivityUpdateData): Promise<void> {
    const prepared = RepositoryBase.prepare(
      { ...data, updatedAt: new Date() },
      this.updateActivityColumnSet,
    )
    const query = this.dbInstance.helpers.update(prepared, this.updateActivityColumnSet)
    const result = await this.db().result(
      `${query} where id = $(id) and "tenantId" = $(tenantId)`,
      {
        id,
        tenantId,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }
}
