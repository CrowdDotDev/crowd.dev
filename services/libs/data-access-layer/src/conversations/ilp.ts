import { generateUUIDv4 } from '@crowd/common'
import { getClientILP } from '@crowd/questdb'

import { IDbConversationCreateData } from '../old/apps/data_sink_worker/repo/conversation.data'

import { Sender } from '@questdb/nodejs-client'

const ilp: Sender = getClientILP()

export async function insertConversations(
  conversations: IDbConversationCreateData[],
): Promise<string[]> {
  const ids: string[] = []
  const now = Date.now()

  for (const conversation of conversations) {
    const id = generateUUIDv4()
    ids.push(id)

    ilp
      .table('conversations')
      .stringColumn('id', id)
      .stringColumn('tenantId', conversation.tenantId)
      .stringColumn('segmentId', conversation.segmentId)
      .stringColumn('slug', conversation.slug)
      .stringColumn('title', conversation.title)
      .booleanColumn('published', conversation.published)
      .timestampColumn('createdAt', now)
      .timestampColumn('updatedAt', now)
      .at(new Date(conversation.timestamp).getTime())
  }

  await ilp.flush()

  return ids
}
