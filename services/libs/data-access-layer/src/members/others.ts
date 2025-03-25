import { IMemberReach } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export interface IMemberTag {
  createdAt: string
  updatedAt: string
  memberId: string
  tagId: string
}

export async function findMemberTags(qx: QueryExecutor, memberId: string): Promise<IMemberTag[]> {
  return qx.select(
    `
      SELECT
        *
      FROM "memberTags"
      WHERE "memberId" = $(memberId)
    `,
    {
      memberId,
    },
  )
}

export async function addMemberTags(
  qx: QueryExecutor,
  memberId: string,
  tagIds: string[],
): Promise<IMemberTag[]> {
  return qx.result(
    `
      INSERT INTO "memberTags" ("createdAt", "updatedAt", "memberId", "tagId")
      SELECT NOW(), NOW(), $(memberId), id
      FROM unnest($(tagIds)::UUID[]) id
      RETURNING *
    `,
    {
      memberId,
      tagIds,
    },
  )
}

export async function removeMemberTags(
  qx: QueryExecutor,
  memberId: string,
  tagIds: string[],
): Promise<void> {
  await qx.result(
    `
      DELETE FROM "memberTags"
      WHERE "memberId" = $(memberId)
      AND "tagId" = ANY($(tagIds)::UUID[])
    `,
    {
      memberId,
      tagIds,
    },
  )
}

export async function updateMemberReach(
  qx: QueryExecutor,
  memberId: string,
  reach: IMemberReach,
): Promise<void> {
  return qx.result(
    `
          UPDATE "members"
          SET
              reach = $(reach)
          WHERE "id" = $(memberId)
      `,
    {
      memberId,
      reach,
    },
  )
}

export async function setMemberUpdatedAt(qx: QueryExecutor, memberId: string): Promise<void> {
  await qx.result(`UPDATE members SET updatedAt = NOW() WHERE id = $(memberId)`, { memberId })
}
