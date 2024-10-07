import { generateUUIDv1 } from '@crowd/common'
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

  private async updateParentIds(
    tenantId: string,
    segmentId: string,
    id: string,
    data: IDbActivityCreateData | IDbActivityUpdateData,
  ): Promise<void> {
    const promises: Promise<void>[] = [
      this.db().none(
        `
        update activities set "parentId" = $(id)
        where "tenantId" = $(tenantId) and "sourceParentId" = $(sourceId)
        and "segmentId" = $(segmentId)
      `,
        {
          id,
          tenantId,
          segmentId,
          sourceId: data.sourceId,
        },
      ),
    ]

    if (data.sourceParentId) {
      promises.push(
        this.db().none(
          `
          update activities set "parentId" = (select id from activities where "tenantId" = $(tenantId) and "sourceId" = $(sourceParentId) and  "segmentId" = $(segmentId) and "deletedAt" IS NULL limit 1)
          where "id" = $(id) and "tenantId" = $(tenantId) and "segmentId" = $(segmentId)
          `,
          {
            id,
            tenantId,
            segmentId,
            sourceParentId: data.sourceParentId,
          },
        ),
      )
    }

    await Promise.all(promises)
  }

  public async create(
    tenantId: string,
    segmentId: string,
    data: IDbActivityCreateData,
  ): Promise<string> {
    this.log.debug('Creating an activity in PostgreSQL!')

    const id = generateUUIDv1()
    const ts = new Date()
    const prepared = RepositoryBase.prepare(
      { ...data, id, tenantId, segmentId, createdAt: ts, updatedAt: ts },
      this.insertActivityColumnSet,
    )
    const query = this.dbInstance.helpers.insert(prepared, this.insertActivityColumnSet)

    await this.db().none(query)

    await this.updateParentIds(tenantId, segmentId, id, data)

    return id
  }

  public async update(
    id: string,
    tenantId: string,
    segmentId: string,
    data: IDbActivityUpdateData,
  ): Promise<void> {
    const prepared = RepositoryBase.prepare(
      { ...data, updatedAt: new Date() },
      this.updateActivityColumnSet,
    )
    const query = this.dbInstance.helpers.update(prepared, this.updateActivityColumnSet)
    const condition = this.format(
      'where id = $(id) and "tenantId" = $(tenantId) and "segmentId" = $(segmentId)',
      {
        id,
        tenantId,
        segmentId,
      },
    )
    const result = await this.db().result(`${query} ${condition}`)

    this.checkUpdateRowCount(result.rowCount, 1)

    await this.updateParentIds(tenantId, segmentId, id, data)
  }
}
