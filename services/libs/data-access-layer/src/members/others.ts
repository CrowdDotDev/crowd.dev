import { IMemberReach } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export interface IMemberTask {
  createdAt: string
  updatedAt: string
  memberId: string
  taskId: string
}

export interface IMemberTag {
  createdAt: string
  updatedAt: string
  memberId: string
  tagId: string
}

export interface IMemberNote {
  createdAt: string
  updatedAt: string
  memberId: string
  noteId: string
}

export async function findMemberTasks(qx: QueryExecutor, memberId: string): Promise<IMemberTask[]> {
  return qx.select(
    `
      SELECT
        *
      FROM "memberTasks"
      WHERE "memberId" = $(memberId)
    `,
    {
      memberId,
    },
  )
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

export async function findMemberNotes(qx: QueryExecutor, memberId: string): Promise<IMemberNote[]> {
  return qx.select(
    `
      SELECT
        *
      FROM "memberNotes"
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

export async function addMemberTasks(
  qx: QueryExecutor,
  memberId: string,
  taskIds: string[],
): Promise<IMemberTask[]> {
  return qx.result(
    `
      INSERT INTO "memberTasks" ("createdAt", "updatedAt", "memberId", "taskId")
      SELECT NOW(), NOW(), $(memberId), id
      FROM unnest($(taskIds)::UUID[]) id
      RETURNING *
    `,
    {
      memberId,
      taskIds,
    },
  )
}

export async function addMemberNotes(
  qx: QueryExecutor,
  memberId: string,
  noteIds: string[],
): Promise<IMemberNote[]> {
  return qx.result(
    `
      INSERT INTO "memberNotes" ("createdAt", "updatedAt", "memberId", "noteId")
      SELECT NOW(), NOW(), $(memberId), id
      FROM unnest($(noteIds)::UUID[]) id
      RETURNING *
    `,
    {
      memberId,
      noteIds,
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

export async function removeMemberTasks(
  qx: QueryExecutor,
  memberId: string,
  taskIds: string[],
): Promise<void> {
  await qx.result(
    `
      DELETE FROM "memberTasks"
      WHERE "memberId" = $(memberId)
      AND "taskId" = ANY($(taskIds)::UUID[])
    `,
    {
      memberId,
      taskIds,
    },
  )
}

export async function removeMemberNotes(
  qx: QueryExecutor,
  memberId: string,
  noteIds: string[],
): Promise<void> {
  await qx.result(
    `
      DELETE FROM "memberNotes"
      WHERE "memberId" = $(memberId)
      AND "noteId" = ANY($(noteIds)::UUID[])
    `,
    {
      memberId,
      noteIds,
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
