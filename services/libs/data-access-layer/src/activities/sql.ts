import { DbConnOrTx } from '@crowd/database'
import { IActivity } from '@crowd/types'

import { IDbActivityUpdateData } from '../old/apps/data_sink_worker/repo/activity.data'

export async function getActivityById(conn: DbConnOrTx, id: string): Promise<IActivity> {
  const activity: IActivity = await conn.query(
    `SELECT
      "id",
      "type",
      "platform",
      "timestamp",
      "score",
      "isContribution",
      "sourceId",
      "sourceParentId",
      "attributes",
      "channel",
      "body",
      "title",
      "url",
      "username",
      "member",
      "objectMemberUsername",
      "objectMember"
    FROM activities
    WHERE "id" = $(id)
    AND "deletedAt" IS NULL
    LIMIT 1;
  `,
    {
      id,
    },
  )

  return activity
}

export async function updateActivity(
  conn: DbConnOrTx,
  id: string,
  activity: IDbActivityUpdateData,
): Promise<void> {
  let query = `UPDATE activities SET
  "type" = $(type),
  "isContribution" = $(isContribution),
  "score" = $(score),
  "sourceId" = $(sourceId),
  "sourceParentId" = $(sourceParentId),
  "memberId" = $(memberId),
  "username" = $(username)`

  if (activity.objectMemberId) {
    query += `, "objectMemberId" = $(objectMemberId)`
  }

  if (activity.objectMemberUsername) {
    query += `, "objectMemberUsername" = $(objectMemberUsername)`
  }

  if (activity.sentiment) {
    query += `, "sentiment" = $(sentiment)`
  }

  if (activity.attributes) {
    query += `, "attributes" = $(attributes)`
  }

  if (activity.body) {
    query += `, "body" = $(body)`
  }

  if (activity.title) {
    query += `, "title" = $(title)`
  }

  if (activity.channel) {
    query += `, "channel" = $(channel)`
  }

  if (activity.url) {
    query += `, "url" = $(url)`
  }

  if (activity.organizationId) {
    query += `, "organizationId" = $(organizationId)`
  }

  if (activity.platform) {
    query += `, "platform" = $(platform)`
  }

  query += 'WHERE "id" = $(id);'

  await conn.none(query, {
    id: id,
    type: activity.type,
    isContribution: activity.isContribution,
    score: activity.score,
    sourceId: activity.sourceId,
    sourceParentId: activity.sourceParentId,
    memberId: activity.memberId,
    username: activity.username,
    objectMemberId: activity.objectMemberId,
    objectMemberUsername: activity.objectMemberUsername,
    attributes: activity.attributes,
    body: activity.body,
    title: activity.title,
    channel: activity.channel,
    url: activity.url,
    organizationId: activity.organizationId,
    platform: activity.platform,
    sentiment: activity.sentiment,
  })
}

export async function updateActivityParentIds(
  conn: DbConnOrTx,
  id: string,
  activity: IDbActivityUpdateData,
): Promise<void> {
  const promises: Promise<void>[] = [
    conn.none(
      `
      UPDATE activities SET "parentId" = $(id)
      WHERE "tenantId" = $(tenantId)
      AND "sourceParentId" = $(sourceId)
      AND "segmentId" = $(segmentId);
    `,
      {
        id,
        tenantId: activity.tenantId,
        segmentId: activity.segmentId,
        sourceId: activity.sourceId,
      },
    ),
  ]

  if (activity.sourceParentId) {
    promises.push(
      conn.none(
        `
        UPDATE activities SET "parentId" = (
          SELECT "id" FROM activities
          WHERE "tenantId" = $(tenantId)
          AND "sourceId" = $(sourceParentId)
          AND "segmentId" = $(segmentId)
          AND "deletedAt" IS NULL
          LIMIT 1
        )
        WHERE "id" = $(id)
        AND "tenantId" = $(tenantId)
        AND "segmentId" = $(segmentId);
        `,
        {
          id,
          tenantId: activity.tenantId,
          segmentId: activity.segmentId,
          sourceParentId: activity.sourceParentId,
        },
      ),
    )
  }

  await Promise.all(promises)
}

export async function deleteActivity(conn: DbConnOrTx, id: string): Promise<void> {
  await conn.none('DELETE FROM activities WHERE id = $(id);', { id })
}
