import merge from 'lodash.merge'
import { convert as convertHtmlToText } from 'html-to-text'

import { generateUUIDv4, getEnv } from '@crowd/common'
import { DbConnOrTx } from '@crowd/database'

import { IDbConversationCreateData } from '../old/apps/data_sink_worker/repo/conversation.data'
import { IConversationWithActivities, IQueryConversationsParameters } from './types'
import { ActivityDisplayVariant, PlatformType } from '@crowd/types'
import { ActivityDisplayService } from '@crowd/integrations'
import { IQueryActivityResult, queryActivities } from '../activities'

const s3Url = `https://${
  process.env['CROWD_S3_MICROSERVICES_ASSETS_BUCKET']
}-${getEnv()}.s3.eu-central-1.amazonaws.com`

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

export async function findConversationsWithActivities(
  conn: DbConnOrTx,
  arg: IQueryConversationsParameters,
): Promise<IConversationWithActivities[]> {
  const query = `
    SELECT * FROM conversations
    WHERE "tenantId" = $(tenantId)
    AND timestamp BETWEEN $(after) AND $(before)
    LIMIT $(limit);
  `

  const convs: IConversationWithActivities[] = await conn.query(query, {
    tenantId: arg.tenantId,
    after: arg.after,
    before: arg.before,
    limit: arg.limit,
  })

  for (const conv of convs) {
    const firstActivity = await queryActivities(conn, {
      tenantId: arg.tenantId,
      segmentIds: arg.segments.map((segment) => segment.id),
      orderBy: ['timestamp', 'ASC'],
      filter: {
        and: [
          {
            conversationId: {
              eq: conv.id,
            },
            parentId: {
              eq: null,
            },
          },
        ],
      },
      limit: 1,
    })

    const remainingActivities = await queryActivities(conn, {
      tenantId: arg.tenantId,
      segmentIds: arg.segments.map((segment) => segment.id),
      orderBy: ['timestamp', 'ASC'],
      filter: {
        and: [
          {
            conversationId: {
              eq: conv.id,
            },
            parentId: {
              not: null,
            },
          },
        ],
      },
    })

    conv.activities = [...firstActivity.rows, ...remainingActivities.rows]

    const conversationStarterActivity = conv.activities[0]
    if (conversationStarterActivity) {
      conv.platform = conversationStarterActivity.platform
      conv.platformIcon = `${s3Url}/email/${conversationStarterActivity.platform}.png`
      conv.body = conversationStarterActivity.title
        ? convertHtmlToText(conversationStarterActivity.title)
        : convertHtmlToText(conversationStarterActivity.body)

      const displayOptions = ActivityDisplayService.getDisplayOptions(
        conversationStarterActivity,
        arg.segments.reduce((acc, s) => merge(acc, s.customActivityTypes), {}),
        [ActivityDisplayVariant.SHORT],
      )

      let prettyChannel = conversationStarterActivity.channel
      let prettyChannelHTML = `<span style='text-decoration:none;color:#4B5563'>${prettyChannel}</span>`

      if (conversationStarterActivity.platform === PlatformType.GITHUB) {
        const prettyChannelSplitted = prettyChannel.split('/')
        prettyChannel = prettyChannelSplitted[prettyChannelSplitted.length - 1]
        prettyChannelHTML = `<span style='color:#e94f2e'><a target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#e94f2e;font-size:14px;line-height:14px" href="${conversationStarterActivity.channel}">${prettyChannel}</a></span>`
      }

      conv.description = `${displayOptions.short} in ${prettyChannelHTML}`
      conv.sourceLink = conversationStarterActivity.url
      conv.member = conversationStarterActivity.username
    }

    const replyActivities = conv.activities.slice(1)
    conv.replyCount = replyActivities.length

    conv.memberCount =
      conv.activities.reduce((acc: IQueryActivityResult, i) => {
        if (!acc.ids) {
          acc.ids = []
          acc.count = 0
        }

        if (!acc.ids[i.memberId]) {
          acc.ids[i.memberId] = true
          acc.count += 1
        }
        return acc
      }).count ?? 0
  }

  return convs
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
