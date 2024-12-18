import { INote, ITag, ITask } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export async function findTasks(qx: QueryExecutor, taskIds: string[]): Promise<ITask[]> {
  return qx.select(
    `
      SELECT
        *
      FROM "tasks"
      WHERE "id" = ANY($(taskIds)::UUID[])
    `,
    {
      taskIds,
    },
  )
}

export async function findTags(qx: QueryExecutor, tagIds: string[]): Promise<ITag[]> {
  return qx.select(
    `
      SELECT
        *
      FROM "tags"
      WHERE "id" = ANY($(tagIds)::UUID[])
    `,
    {
      tagIds,
    },
  )
}

export async function findNotes(qx: QueryExecutor, noteIds: string[]): Promise<INote[]> {
  return qx.select(
    `
      SELECT
        *
      FROM "notes"
      WHERE "id" = ANY($(noteIds)::UUID[])
    `,
    {
      noteIds,
    },
  )
}
