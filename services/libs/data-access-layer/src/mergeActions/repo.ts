import validator from 'validator'

import { IMergeAction, IMergeActionColumns, MergeActionType } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'
import { QueryOptions, QueryResult, queryTable } from '../utils'

const DEFAULT_MERGE_ACTIONS_COLUMNS: IMergeActionColumns[] = [
  'id',
  'type',
  'primaryId',
  'secondaryId',
  'createdAt',
  'updatedAt',
  'state',
  'step',
]

export async function queryMergeActions<T extends IMergeActionColumns>(
  qx: QueryExecutor,
  opts: QueryOptions<T>,
  columns: IMergeActionColumns[] = DEFAULT_MERGE_ACTIONS_COLUMNS,
): Promise<QueryResult<T>[]> {
  return queryTable(qx, 'mergeActions', columns, opts)
}

export async function findEntityMergeActions(
  qx: QueryExecutor,
  entityId: string,
  type: MergeActionType,
  { state = [], limit = 20, offset = 0 },
): Promise<IMergeAction[]> {
  if (!validator.isUUID(entityId)) {
    throw new Error('Invalid entityId')
  }

  const conditions = [`(ma."primaryId" = $(entityId) OR ma."secondaryId" = $(entityId))`]

  if (type) {
    conditions.push(`ma.type = $(type)`)
  }

  if (state.length > 0) {
    conditions.push(`ma.state IN ($(state:csv))`)
  }

  const result = await qx.select(
    `
      SELECT
        ma."primaryId",
        ma."secondaryId",
        ma."state",
        ma."step"
      FROM "mergeActions" ma
      WHERE ${conditions.join(' AND ')}
      ORDER BY ma."createdAt" DESC
      LIMIT $(limit)
      OFFSET $(offset)
    `,
    {
      entityId,
      type,
      state,
      limit,
      offset,
    },
  )

  return result
}
