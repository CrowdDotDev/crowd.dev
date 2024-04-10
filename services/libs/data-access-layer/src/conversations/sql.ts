import { generateUUIDv4 } from '@crowd/common'
import { DbConnection } from '@crowd/database'
import { getClientSQL } from '@crowd/questdb'

import { IDbConversationCreateData } from '../old/apps/data_sink_worker/repo/conversation.data'

const sql: DbConnection = getClientSQL()

export async function insertConversation(conversation: IDbConversationCreateData): Promise<string> {
  const now = new Date()
  const id = generateUUIDv4()

  await sql.tx(async (tx) => {
    await tx.none(
      `
      INSERT INTO "conversations" ("id", "tenantId", "segmentId", "slug", "title", "published", "createdAt", "updatedAt", "timestamp")
      VALUES ($(id), $(tenantId), $(segmentId), $(slug), $(title), $(published), $(now), $(now), $(timestamp));
      `,
      {
        id,
        tenantId: conversation.tenantId,
        segmentId: conversation.segmentId,
        slug: conversation.slug,
        title: conversation.title,
        published: conversation.published,
        now,
        timestamp: conversation.timestamp ? new Date(conversation.timestamp) : now,
      },
    )

    if (conversation.activityParentId) {
      await tx.none(
        `
        UPDATE "activities" SET "conversationId" = $(id)
        WHERE "id" = $(activityParentId)
        AND "tenantId" = $(tenantId)
        AND "segmentId" = $(segmentId);
        `,
        {
          id,
          tenantId: conversation.tenantId,
          segmentId: conversation.segmentId,
          activityParentId: conversation.activityParentId,
        },
      )
    }

    if (
      conversation.activityChildId &&
      conversation.activityChildId !== conversation.activityParentId
    ) {
      await tx.none(
        `
        UPDATE "activities" SET "conversationId" = $(id)
        WHERE "id" = $(activityChildId)
        AND "tenantId" = $(tenantId)
        AND "segmentId" = $(segmentId);
        `,
        {
          id,
          tenantId: conversation.tenantId,
          segmentId: conversation.segmentId,
          activityChildId: conversation.activityChildId,
        },
      )
    }
  })

  return id
}

export async function deleteConversation(id: string): Promise<void> {
  await Promise.all([
    sql.none('DELETE FROM activities WHERE "conversationId" = $(id);', { id }),
    sql.none('DELETE FROM conversations WHERE "id" = $(id);', { id }),
  ])
}
