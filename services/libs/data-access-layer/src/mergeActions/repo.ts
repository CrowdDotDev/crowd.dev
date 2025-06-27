import validator from 'validator'

import { IMergeAction, MergeActionState, MergeActionType } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export async function findMergeAction(
  qx: QueryExecutor,
  primaryId: string,
  secondaryId: string,
  { state }: { state?: MergeActionState } = {},
): Promise<IMergeAction> {
  const conditions = [`"primaryId" = $(primaryId)`, `"secondaryId" = $(secondaryId)`]

  const params: Record<string, unknown> = {
    primaryId,
    secondaryId,
  }

  if (state) {
    conditions.push(`"state" = $(state)`)
    params.state = state
  }

  return qx.selectOneOrNone(
    `
      select * from "mergeActions" 
      where ${conditions.join(' AND ')}
    `,
    params,
  )
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
