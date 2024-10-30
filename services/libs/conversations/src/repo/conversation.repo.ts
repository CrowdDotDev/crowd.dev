import { DbColumnSet, DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { getInsertConversationColumnSet } from './conversation.data'

export class ConversationRepository extends RepositoryBase<ConversationRepository> {
  private readonly insertConversationColumnSet: DbColumnSet
  constructor(store: DbStore, parentLog: Logger) {
    super(store, parentLog)

    this.insertConversationColumnSet = getInsertConversationColumnSet(this.dbInstance)
  }

  public async createConversation(
    id: string,
    tenantId: string,
    segmentId: string,
    title: string,
    published: boolean,
    slug: string,
  ): Promise<string> {
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
}
