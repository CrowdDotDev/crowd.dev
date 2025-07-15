import validator from 'validator'

import { DEFAULT_TENANT_ID } from '@crowd/common'
import {
  IMemberUnmergeBackup,
  IMergeAction,
  IOrganizationUnmergeBackup,
  IUnmergeBackup,
  MergeActionState,
  MergeActionStep,
  MergeActionType,
} from '@crowd/types'

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

export async function setMergeAction(
  qx: QueryExecutor,
  type: MergeActionType,
  primaryId: string,
  secondaryId: string,
  data: {
    step?: MergeActionStep
    state?: MergeActionState
  },
): Promise<boolean> {
  const setClauses = []
  const replacements: Record<string, unknown> = {
    tenantId: DEFAULT_TENANT_ID,
    type,
    primaryId,
    secondaryId,
  }

  if (data.step) {
    setClauses.push(`step = $(step)`)
    replacements.step = data.step
  }

  if (data.state) {
    setClauses.push(`state = $(state)`)
    replacements.state = data.state
  }

  const rowCount = await qx.result(
    `
        UPDATE "mergeActions"
        SET ${setClauses.join(', ')}
        WHERE "tenantId" = :tenantId
          AND type = :type
          AND "primaryId" = :primaryId
          AND "secondaryId" = :secondaryId
      `,
    replacements,
  )

  return rowCount > 0
}

export async function addMergeAction(
  qx: QueryExecutor,
  type: MergeActionType,
  primaryId: string,
  secondaryId: string,
  step: MergeActionStep,
  state: MergeActionState = MergeActionState.IN_PROGRESS,
  backup: IUnmergeBackup<IMemberUnmergeBackup | IOrganizationUnmergeBackup> = undefined,
  userId?: string,
): Promise<void> {
  await qx.result(
    `
    INSERT INTO "mergeActions" ("tenantId", "type", "primaryId", "secondaryId", state, step, "unmergeBackup", "actionBy")
    VALUES ($(tenantId), $(type), $(primaryId), $(secondaryId), $(state), $(step), $(backup), $(userId))
    ON CONFLICT ("tenantId", "type", "primaryId", "secondaryId")
    DO UPDATE SET state = $(state), step = $(step), "unmergeBackup" = $(backup), "updatedAt" = now()
    `,
    {
      tenantId: DEFAULT_TENANT_ID,
      type,
      primaryId,
      secondaryId,
      step,
      state,
      backup: backup ? JSON.stringify(backup) : null,
      userId,
    },
  )
}
