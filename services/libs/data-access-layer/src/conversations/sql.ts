import { generateUUIDv4 } from '@crowd/common'
import { DbConnOrTx } from '@crowd/database'

import { IDbConversationCreateData } from '../old/apps/data_sink_worker/repo/conversation.data'

export async function insertConversation(
  conn: DbConnOrTx,
  conversation: IDbConversationCreateData,
): Promise<string> {
  const now = new Date()
  const id = generateUUIDv4()

  await conn.tx(async (tx) => {
    await tx.none(
      `
      INSERT INTO "conversations" ("id", "tenantId", "segmentId", "slug", "title", "published", "createdAt", "updatedAt", "timestamp")
      VALUES ($(id), $(tenantId), $(segmentId), $(slug), $(title), $(published), $(now), $(now), $(timestamp));
      `,
      {
        id: conversation.id || id,
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
          id: conversation.id || id,
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
          id: conversation.id || id,
          tenantId: conversation.tenantId,
          segmentId: conversation.segmentId,
          activityChildId: conversation.activityChildId,
        },
      )
    }
  })

  return id
}

export async function deleteConversations(conn: DbConnOrTx, ids: string[]): Promise<void> {
  await Promise.all(
    ids.map(async (id) => {
      return Promise.all([
        await conn.query(
          'UPDATE activities SET deletedAt = NOW() WHERE "conversationId" = $(id);',
          {
            id,
          },
        ),
        await conn.query('UPDATE conversations SET deletedAt = NOW() WHERE "id" = $(id);', { id }),
      ])
    }),
  )
}
