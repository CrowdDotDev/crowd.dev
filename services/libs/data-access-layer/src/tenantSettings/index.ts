import { DEFAULT_TENANT_ID } from '@crowd/common'

import { QueryExecutor } from '../queryExecutor'

const tenantId = DEFAULT_TENANT_ID

export async function getLastMemberDisplayAggsSyncedAt(qx: QueryExecutor): Promise<string> {
  return qx.selectOne(
    `
    SELECT "lastMemberDisplayAggsSyncedAt"
    FROM "tenants"
    WHERE "id" = $(tenantId)
    `,
    { tenantId },
  )
}

export async function touchLastMemberDisplayAggsSyncedAt(qx: QueryExecutor): Promise<void> {
  return qx.result(
    `
    UPDATE "tenants"
    SET "lastMemberDisplayAggsSyncedAt" = now()
    WHERE "id" = $(tenantId)
    `,
    { tenantId },
  )
}

export async function getLastOrganizationDisplayAggsSyncedAt(qx: QueryExecutor): Promise<string> {
  return qx.selectOne(
    `
    SELECT "lastOrganizationDisplayAggsSyncedAt"
    FROM "tenants"
    WHERE "id" = $(tenantId)
    `,
    { tenantId },
  )
}

export async function touchLastOrganizationDisplayAggsSyncedAt(qx: QueryExecutor): Promise<void> {
  return qx.result(
    `
    UPDATE "tenants"
    SET "lastOrganizationDisplayAggsSyncedAt" = now()
    WHERE "id" = $(tenantId)
    `,
    { tenantId },
  )
}
