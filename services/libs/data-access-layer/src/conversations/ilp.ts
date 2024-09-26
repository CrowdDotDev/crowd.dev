import { Sender } from '@questdb/nodejs-client'

import { generateUUIDv4 } from '@crowd/common'
import { getClientILP } from '@crowd/questdb'

import { IDbConversationCreateData } from '../old/apps/data_sink_worker/repo/conversation.data'

const ilp: Sender = getClientILP()
export async function insertConversations(
  conversations: IDbConversationCreateData[],
): Promise<string[]> {
  const ids: string[] = []
  const now = Date.now()

  if (conversations.length > 0) {
    for (const conversation of conversations) {
      const id = conversation.id || generateUUIDv4()
      ids.push(id)

      const row = ilp
        .table('conversations')
        .symbol('tenantId', conversation.tenantId)
        .symbol('segmentId', conversation.segmentId)
        .stringColumn('id', id)
        .stringColumn('title', conversation.title)
        .stringColumn('slug', conversation.slug)
        .booleanColumn('published', conversation.published || false)
        .timestampColumn(
          'createdAt',
          conversation.createdAt ? new Date(conversation.createdAt).getTime() : now,
          'ms',
        )
        .timestampColumn(
          'updatedAt',
          conversation.updatedAt ? new Date(conversation.updatedAt).getTime() : now,
          'ms',
        )

      if (conversation.deletedAt) {
        row.timestampColumn('deletedAt', new Date(conversation.updatedAt).getTime())
      }

      if (conversation.createdById) {
        row.stringColumn('createdById', conversation.createdById)
      }

      if (conversation.updatedById) {
        row.stringColumn('updatedById', conversation.updatedById)
      }

      await row.at(conversation.timestamp ? new Date(conversation.timestamp).getTime() : now, 'ms')
    }
  }

  return ids
}
