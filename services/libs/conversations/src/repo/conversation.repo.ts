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

  public async checkSlugExists(tenantId: string, slug: string): Promise<boolean> {
    const results = await this.db().any(
      `select id from conversations where "tenantId" = $(tenantId) and slug = $(slug)`,
      {
        tenantId,
        slug,
      },
    )

    if (results.length > 0) {
      return true
    }

    return false
  }

  public async getConversation(tenantId: string, id: string): Promise<IDbConversation | null> {
    const result = await this.db().oneOrNone(
      `select id, published from conversations where "tenantId" = $(tenantId) and id = $(id)`,
      {
        tenantId,
        id,
      },
    )

    return result
  }

  public async getActivityData(tenantId: string, activityId: string): Promise<IDbActivityInfo> {
    const results = await this.db().one(
      `select id, "conversationId", "sourceId", "sourceParentId", "parentId", platform, body, title, channel
       from activities
       where "tenantId" = $(tenantId) and id = $(activityId)`,
      {
        tenantId,
        activityId,
      },
    )
    return results
  }

  public async getActivities(
    tenantId: string,
    sourceParentId: string,
    page: number,
    perPage: number,
  ): Promise<IDbActivityInfo[]> {
    const results = await this.db().any(
      `
      select id, "conversationId", "sourceId", "sourceParentId", "parentId", platform, body, title, channel
      from activities
      where "tenantId" = $(tenantId) and "sourceParentId" = $(sourceParentId)
      limit ${perPage} offset ${(page - 1) * perPage}
      `,
      {
        tenantId,
        sourceParentId,
      },
    )

    return results
  }

  public async setConversationTitleAndSlug(
    tenantId: string,
    id: string,
    title: string,
    slug: string,
  ): Promise<void> {
    const result = await this.db().result(
      `update conversations 
       set title = $(title),
           slug = $(slug)
       where id = $(id) and "tenantId" = $(tenantId)`,
      {
        tenantId,
        id,
        title,
        slug,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async setActivityConversationId(
    tenantId: string,
    activityId: string,
    conversationId: string,
  ): Promise<void> {
    const result = await this.db().result(
      `update activities set "conversationId" = $(conversationId) where id = $(activityId) and "tenantId" = $(tenantId)`,
      {
        activityId,
        conversationId,
        tenantId,
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async getConversationCount(tenantId: string): Promise<number> {
    const result = await this.db().one(
      `select count(id) as count from conversations where "tenantId" = $(tenantId)`,
      {
        tenantId,
      },
    )

    return result.count
  }
}
