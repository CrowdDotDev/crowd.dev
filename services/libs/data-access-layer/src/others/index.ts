import { ITag } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

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
