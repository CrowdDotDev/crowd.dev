import { convert as convertHtmlToText } from 'html-to-text'
import merge from 'lodash.merge'

import { generateUUIDv4, getEnv } from '@crowd/common'
import { DbConnOrTx } from '@crowd/database'

import { ActivityDisplayService } from '@crowd/integrations'
import { ActivityDisplayVariant, PageData, PlatformType } from '@crowd/types'
import { IQueryActivityResult, queryActivities } from '../activities'
import {
  IDbConversation,
  IDbConversationCreateData,
  IDbConversationUpdateData,
} from '../old/apps/data_sink_worker/repo/conversation.data'
import { checkUpdateRowCount } from '../utils'
import {
  IConversationWithActivities,
  IQueryConversationResult,
  IQueryConversationsParameters,
  IQueryConversationsWithActivitiesParameters,
} from './types'

/* eslint-disable @typescript-eslint/no-explicit-any */

const s3Url = `https://${
  process.env['CROWD_S3_MICROSERVICES_ASSETS_BUCKET']
}-${getEnv()}.s3.eu-central-1.amazonaws.com`

export async function getConversationById(
  conn: DbConnOrTx,
  id: string,
  tenantId: string,
  segmentIds: string[],
): Promise<IDbConversation | null> {
  const conversation: IDbConversation | null = await conn.oneOrNone(
    `
      select id,
             title,
             slug, 
             published,
             "tenantId",
             "segmentId"
      from conversations
      where 
        id = $(id) and 
        "tenantId" = $(tenantId) and 
        "segmentId" in ($(segmentIds:csv)) and 
        "deletedAt" is null
    `,
    {
      id,
      tenantId,
      segmentIds,
    },
  )

  return conversation
}

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

export async function updateConversation(
  conn: DbConnOrTx,
  id: string,
  data: IDbConversationUpdateData,
): Promise<void> {
  if (!data.tenantId || !data.segmentId) {
    throw new Error('tenantId and segmentId are required to update conversation!')
  }

  const toUpdate: any = {}

  if (data.title) {
    toUpdate.title = data.title
  }

  if (data.slug) {
    toUpdate.slug = data.slug
  }

  if (data.published !== undefined) {
    toUpdate.published = data.published
  }

  const keys = Object.keys(toUpdate)
  if (keys.length === 0) {
    return
  }

  const params: any = {
    id,
    tenantId: data.tenantId,
    segmentId: data.segmentId,
  }

  const sets: string[] = []
  for (const key of keys) {
    sets.push(`"${key}" = $(${key})`)
    params[key] = toUpdate[key]
  }

  if (data.updatedById) {
    sets.push('"updatedById" = $(updatedById)')
    params.updatedById = data.updatedById
  }

  const query = `
    update conversations set
    ${sets.join(', ')}
    where "id" = $(id) and "tenantId" = $(tenantId) and "segmentId" = $(segmentId);
  `

  const result = await conn.result(query, params)

  checkUpdateRowCount(result.rowCount, 1)
}

export async function findConversationsWithActivities(
  conn: DbConnOrTx,
  arg: IQueryConversationsWithActivitiesParameters,
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

export async function setConversationToActivity(
  conn: DbConnOrTx,
  conversationId: string,
  activityId: string,
  tenantId: string,
  segmentId: string,
): Promise<void> {
  const result = await conn.result(
    `
      update activities
      set "conversationId" = $(conversationId)
      where id = $(activityId) and "tenantId" = $(tenantId) and "segmentId" = $(segmentId) and "deletedAt" is null
    `,
    {
      conversationId,
      activityId,
      tenantId,
      segmentId,
    },
  )

  checkUpdateRowCount(result.rowCount, 1)
}

export async function doesConversationWithSlugExists(
  conn: DbConnOrTx,
  slug: string,
  tenantId: string,
  segmentId: string,
): Promise<boolean> {
  const results = await conn.any(
    `
    select id 
    from conversations 
    where 
      "tenantId" = $(tenantId) and 
      "segmentId" = $(segmentId) and 
      slug = $(slug) and 
      "deletedAt" is null
  `,
    {
      tenantId,
      segmentId,
      slug,
    },
  )

  if (results.length > 0) {
    return true
  }

  return false
}

const CONVERSATION_QUERY_FILTER_COLUMN_MAP: Map<string, string> = new Map([
  ['id', 'c.id'],
  ['title', 'c.title'],
  ['slug', 'c.slug'],
  ['published', 'c.published'],
])
export async function queryConversations(
  qdbConn: DbConnOrTx,
  arg: IQueryConversationsParameters,
): Promise<PageData<IQueryConversationResult>> {
  if (arg.tenantId === undefined || arg.segmentIds === undefined || arg.segmentIds.length === 0) {
    throw new Error('tenantId and segmentIds are required to query conversations!')
  }

  // set defaults
  arg.filter = arg.filter || {}
  arg.orderBy = arg.orderBy || ['lastActive_DESC']

  // TODO questdb

  return {
    rows: [],
    count: 0,
    limit: arg.limit,
    offset: arg.offset,
  }
}
