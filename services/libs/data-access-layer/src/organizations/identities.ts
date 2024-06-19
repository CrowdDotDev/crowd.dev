import { QueryExecutor } from '../queryExecutor'
import { IOrgIdentity, IOrgIdentityInsertInput, IOrgIdentityUpdateInput } from './types'

export async function fetchOrgIdentities(
  qx: QueryExecutor,
  organizationId: string,
): Promise<IOrgIdentity[]> {
  return qx.select(
    `
      SELECT *
      FROM "organizationIdentities"
      WHERE "organizationId" = $(organizationId)
    `,
    {
      organizationId,
    },
  )
}

export async function fetchManyOrgIdentities(
  qx: QueryExecutor,
  organizationIds: string[],
  tenantId: string,
): Promise<{ organizationId: string; identities: IOrgIdentity[] }[]> {
  return qx.select(
    `
      SELECT
          oi."organizationId",
          JSONB_AGG(oi ORDER BY oi."createdAt") AS "identities"
      FROM "organizationIdentities" oi
      WHERE oi."organizationId" IN ($(organizationIds:csv))
        AND oi."tenantId" = $(tenantId)
      GROUP BY oi."organizationId"
    `,
    {
      organizationIds,
      tenantId,
    },
  )
}

export async function cleanUpOrgIdentities(
  qx: QueryExecutor,
  organizationId: string,
  tenantId: string,
) {
  return qx.result(
    `
      DELETE
      FROM "organizationIdentities"
      WHERE "organizationId" = $(organizationId)
        AND "tenantId" = $(tenantId)
    `,
    {
      organizationId,
      tenantId,
    },
  )
}

export async function updateOrgIdentity(
  qx: QueryExecutor,
  identity: IOrgIdentityUpdateInput,
): Promise<void> {
  await qx.result(
    `
    update "organizationIdentities" set verified = $(verified)
    where "organizationId" = $(organizationId) and "tenantId" = $(tenantId) and platform = $(platform) and value = $(value) and type = $(type)
    `,
    identity,
  )
}

export async function addOrgIdentity(qx: QueryExecutor, identity: IOrgIdentityInsertInput) {
  return qx.result(
    `
      INSERT INTO "organizationIdentities" (
        "organizationId",
        platform,
        value,
        type,
        verified,
        "sourceId",
        "tenantId",
        "integrationId",
        "createdAt"
      )
      VALUES ($(organizationId), $(platform), $(value), $(type), $(verified), $(sourceId), $(tenantId), $(integrationId), NOW())
      ON CONFLICT DO NOTHING;
    `,
    identity,
  )
}
