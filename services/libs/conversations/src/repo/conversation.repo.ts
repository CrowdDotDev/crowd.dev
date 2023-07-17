import { generateUUIDv1 } from '@crowd/common'
import { DbColumnSet, DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  IDbActivityInfo,
  IDbConversation,
  IDbConversationSettings,
  getInsertConversationColumnSet,
} from './conversation.data'

export class ConversationRepository extends RepositoryBase<ConversationRepository> {
  private readonly insertConversationColumnSet: DbColumnSet
  constructor(store: DbStore, parentLog: Logger) {
    super(store, parentLog)

    this.insertConversationColumnSet = getInsertConversationColumnSet(this.dbInstance)
  }

  public async createConversation(
    tenantId: string,
    segmentId: string,
    title: string,
    published: boolean,
    slug: string,
  ): Promise<string> {
    const id = generateUUIDv1()
    const now = new Date()
    const prepared = RepositoryBase.prepare(
      {
        id,
        tenantId,
        segmentId,
        title,
        published,
        slug,
        createdAt: now,
        updatedAt: now,
      },
      this.insertConversationColumnSet,
    )

    const query = this.dbInstance.helpers.insert(prepared, this.insertConversationColumnSet)
    await this.db().none(query)

    return id
  }

  public async getConversationSettings(tenantId: string): Promise<IDbConversationSettings> {
    const id = generateUUIDv1()

    const results = await this.db().oneOrNone(
      `select "autoPublish" from "conversationSettings" where "tenantId" = $(tenantId) and (enabled is null or enabled = true)`,
      {
        tenantId,
      },
    )

    if (results) {
      return results
    }

    const now = new Date()
    const result = await this.db().result(
      `insert into "conversationSettings"(id, "tenantId", "createdAt", "updatedAt", "createdById")
       values ($(id), $(tenantId), $(now), $(now), (select "createdById" from tenants where id = $(tenantId) limit 1));`,
      {
        id,
        tenantId,
        now,
      },
    )
    this.checkUpdateRowCount(result.rowCount, 1)

    return {
      autoPublish: null,
    }
  }

  public async checkSlugExists(
    tenantId: string,
    segmentId: string,
    slug: string,
  ): Promise<boolean> {
    const results = await this.db().any(
      `select id from conversations where "tenantId" = $(tenantId) and slug = $(slug) and "segmentId" = $(segmentId)`,
      {
        tenantId,
        slug,
        segmentId,
      },
    )

    if (results.length > 0) {
      return true
    }

    return false
  }

  public async getConversation(
    tenantId: string,
    segmentId: string,
    id: string,
  ): Promise<IDbConversation | null> {
    const result = await this.db().oneOrNone(
      `select id, published from conversations where "tenantId" = $(tenantId) and "segmentId" = $(segmentId) and id = $(id)`,
      {
        tenantId,
        id,
        segmentId,
      },
    )

    return result
  }

  public async getActivityData(
    tenantId: string,
    segmentId: string,
    activityId: string,
  ): Promise<IDbActivityInfo> {
    const results = await this.db().one(
      `select id, "conversationId", "sourceId", "sourceParentId", "parentId", platform, body, title, channel
       from activities
       where "tenantId" = $(tenantId) and id = $(activityId) and "segmentId" = $(segmentId)`,
      {
        tenantId,
        activityId,
        segmentId,
      },
    )
    return results
  }

  public async getActivities(
    tenantId: string,
    segmentId: string,
    sourceParentId: string,
    page: number,
    perPage: number,
  ): Promise<IDbActivityInfo[]> {
    const results = await this.db().any(
      `
      select id, "conversationId", "sourceId", "sourceParentId", "parentId", platform, body, title, channel
      from activities
      where "tenantId" = $(tenantId) and "sourceParentId" = $(sourceParentId) and "segmentId" = $(segmentId)
      limit ${perPage} offset ${(page - 1) * perPage}
      `,
      {
        tenantId,
        sourceParentId,
        segmentId,
      },
    )

    return results
  }

  public async setConversationTitleAndSlug(
    tenantId: string,
    segmentId: string,
    id: string,
    title: string,
    slug: string,
  ): Promise<void> {
    const result = await this.db().result(
      `update conversations 
       set title = $(title),
           slug = $(slug)
       where id = $(id) and "tenantId" = $(tenantId) and "segmentId" = $(segmentId)`,
      {
        tenantId,
        id,
        title,
        slug,
        segmentId,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async setActivityConversationId(
    tenantId: string,
    segmentId: string,
    activityId: string,
    conversationId: string,
  ): Promise<void> {
    const result = await this.db().result(
      `update activities set "conversationId" = $(conversationId) where id = $(activityId) and "tenantId" = $(tenantId) and "segmentId" = $(segmentId)`,
      {
        activityId,
        conversationId,
        tenantId,
        segmentId,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async getConversationCount(tenantId: string, segmentId: string): Promise<number> {
    const result = await this.db().one(
      `select count(id) as count from conversations where "tenantId" = $(tenantId) and "segmentId" = $(segmentId)`,
      {
        tenantId,
        segmentId,
      },
    )

    return result.count
  }
}
