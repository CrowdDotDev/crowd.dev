import validator from 'validator'

import { IMergeAction, IMergeActionColumns, MergeActionState, MergeActionStep, MergeActionType } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'
import { QueryOptions, QueryResult, queryTable } from '../utils'
import { EntityType } from '../old/apps/script_executor_worker/types'

const MERGE_ACTIONS_COLUMNS: IMergeActionColumns[] = [
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
): Promise<QueryResult<T>[]> {
  return queryTable(qx, 'mergeActions', MERGE_ACTIONS_COLUMNS, opts)
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

export async function getIncompleteMergeActions(
  qx: QueryExecutor,
  type: 'member' | 'org',
  step: MergeActionStep
) {
  const table = type === 'member' ? 'members' : 'organizations';

  return qx.select(
    `
    SELECT ma.*
    FROM "mergeActions" ma
        JOIN "${table}" t1 ON ma."primaryId" = t1."id"
        JOIN "${table}" t2 ON ma."secondaryId" = t2."id"
    WHERE ma.type = $(type)
    AND ma."step" = $(step);
    `,
    { type, step },
  );
}

export async function updateMergeAction(qx: QueryExecutor, primaryId: string, secondaryId: string, state: string) {
  return qx.result(
    `
    UPDATE "mergeActions"
    SET "state" = $(state)
    WHERE "primaryId" = $(primaryId) 
    AND "secondaryId" = $(secondaryId);
    `,
    { primaryId, secondaryId, state },
  )
}