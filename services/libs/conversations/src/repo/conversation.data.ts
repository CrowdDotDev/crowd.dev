import { DbColumnSet, DbInstance } from '@crowd/database'

export interface IDbActivityInfo {
  id: string
  conversationId: string | null
  sourceId: string
  parentId: string | null
  sourceParentId: string | null
  platform: string
  body: string | null
  title: string | null
  channel: string | null
}

export interface IDbConversation {
  id: string
  published: boolean
}

export interface IDbConversationSettings {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  autoPublish: any | null
}

let insertConversationColumnSet: DbColumnSet
export const getInsertConversationColumnSet = (instance: DbInstance): DbColumnSet => {
  if (insertConversationColumnSet) return insertConversationColumnSet

  insertConversationColumnSet = new instance.helpers.ColumnSet(
    ['id', 'title', 'slug', 'published', 'tenantId', 'segmentId', 'createdAt', 'updatedAt'],
    {
      table: {
        table: 'conversations',
      },
    },
  )

  return insertConversationColumnSet
}
