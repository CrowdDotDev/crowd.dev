import { Sender } from '@questdb/nodejs-client'

import { DEFAULT_TENANT_ID, generateUUIDv4 } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import { getClientILP } from '@crowd/questdb'

import { IDbConversationCreateData } from '../old/apps/data_sink_worker/repo/conversation.data'

const log = getServiceChildLogger('data-access-layer/conversations/ilp.ts')

let ilp: Sender
export async function insertConversations(
  conversations: IDbConversationCreateData[],
  update = false,
): Promise<string[]> {
  const ids: string[] = []
  const now = Date.now()

  if (conversations.length > 0) {
    ilp = getClientILP()

    for (const conversation of conversations) {
      const id = conversation.id || generateUUIDv4()
      ids.push(id)

      let updatedAt
      if (update || !conversation.updatedAt) {
        updatedAt = now
      } else {
        const res = new Date(conversation.updatedAt)
        updatedAt = res.getTime()
      }

      const row = ilp
        .table('conversations')
        .symbol('tenantId', DEFAULT_TENANT_ID)
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
        .timestampColumn('updatedAt', updatedAt, 'ms')

      if (conversation.deletedAt) {
        const res = new Date(conversation.updatedAt)
        log.info({ deletedAt: res }, 'insertConversations.deletedAt')
        row.timestampColumn('deletedAt', res.getTime(), 'ms')
      }

      if (conversation.createdById) {
        row.stringColumn('createdById', conversation.createdById)
      }

      if (conversation.updatedById) {
        row.stringColumn('updatedById', conversation.updatedById)
      }

      let timestamp
      if (conversation.timestamp) {
        const res = new Date(conversation.timestamp)
        // log.info({ timestamp: res }, 'insertConversations.timestamp')
        timestamp = res.getTime()
      } else {
        timestamp = now
      }

      await row.at(timestamp, 'ms')
    }
  }

  return ids
}
