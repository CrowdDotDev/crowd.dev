import { DbColumnSet, DbStore, RepositoryBase, eqOrNull } from '@crowd/database'
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
            platform,
            timestamp,
            "isContribution",
            score,
            "sourceId",
            "sourceParentId",
            "parentId",
            "memberId",
            username,
            "objectMemberId",
            "objectMemberUsername",
            attributes,
            "importHash",
            body,
            title,
            channel,
            url,
            sentiment,
            "deletedAt"
    from activities
    where "tenantId" = $(tenantId)
      and "segmentId" = $(segmentId)
      and "sourceId" = $(sourceId)
      and platform = $(platform)
      and type = $(type)
      and channel $(channel)
    limit 1;
  `
  public async findExisting(
    tenantId: string,
    segmentId: string,
    sourceId: string,
    platform: string,
    type: string,
    channel: string | null | undefined,
  ): Promise<IDbActivity | null> {
    const result = await this.db().oneOrNone(this.findExistingActivityQuery, {
      tenantId,
      segmentId,
      sourceId,
      platform,
      type,
      channel: eqOrNull(channel),
    })

    return result
  }

  public async findExistingBySourceIdAndChannel(
    tenantId: string,
    segmentId: string,
    sourceId: string,
    channel: string,
  ): Promise<IDbActivity | null> {
    const result = await this.db().oneOrNone(
      `
      select  id,
              type,
              platform,
              timestamp,
              "isContribution",
              score,
              "sourceId",
              "sourceParentId",
              "parentId",
              "memberId",
              username,
              "objectMemberId",
              "objectMemberUsername",
              attributes,
              "importHash",
              body,
              title,
              channel,
              url,
              sentiment,
              "deletedAt"
      from activities
      where "tenantId" = $(tenantId)
        and "segmentId" = $(segmentId)
        and "sourceId" = $(sourceId)
        and channel = $(channel)
        and "deletedAt" IS NULL
      limit 1;
    `,
      {
        tenantId,
        segmentId,
        sourceId,
        channel,
      },
    )

    return result
  }

  public async delete(id: string): Promise<void> {
    await this.db().none('delete from activities where id = $(id)', { id })
  }

  public async existsWithId(id: string): Promise<boolean> {
    const result = await this.db().oneOrNone('select 1 from activities where id = $(id)', { id })
    return result !== null
  }

  public async rawUpdate(id: string, data: IDbActivityUpdateData): Promise<void> {
    const prepared = RepositoryBase.prepare(
      { ...data, updatedAt: new Date() },
      this.updateActivityColumnSet,
    )
    const query = this.dbInstance.helpers.update(prepared, this.updateActivityColumnSet)
    const condition = this.format('where id = $(id)', { id })
    await this.db().none(`${query} ${condition}`)
  }

  public async rawInsert(data: IDbActivityCreateData): Promise<void> {
    const prepared = RepositoryBase.prepare(data, this.insertActivityColumnSet)
    const query = this.dbInstance.helpers.insert(prepared, this.insertActivityColumnSet)
    await this.db().none(query)
  }
}
