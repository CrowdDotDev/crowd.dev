import validator from 'validator'

import { IMergeAction, MergeActionState } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export async function queryMergeActions(
  qx: QueryExecutor,
  { entityId, type, state = [], limit = 20, offset = 0 },
): Promise<IMergeAction[]> {
  let where = ''

  if (entityId) {
    if (!validator.isUUID(entityId)) {
      return []
    }
    where += ` AND (ma."primaryId" = $(entityId) OR ma."secondaryId" = $(entityId))`
  }

  if (type) {
    where += ` AND ma.type = $(type)`
  }

  if (state.length) {
    where += ` AND ma.state IN ($(state:csv))`
  }

  const result = await qx.select(
    `
      SELECT
        ma."primaryId",
        ma."secondaryId",
        ma."state",
        ma."step"
      FROM "mergeActions" ma
      WHERE 1 = 1
        ${where}
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

export async function findMergeAction(
  qx: QueryExecutor,
  primaryId: string,
  secondaryId: string,
  { state }: { state?: MergeActionState } = {},
): Promise<IMergeAction> {
  let where = ''

  const params = {
    primaryId,
    secondaryId,
  }

  if (state) {
    where += ` and "state" = $(state)`
    params['state'] = state
  }

  return qx.selectOneOrNone(
    `
      select * from "mergeActions" 
      where "primaryId" = $(primaryId) 
        and "secondaryId" = $(secondaryId)
        ${where}
    `,
    params,
  )
}
