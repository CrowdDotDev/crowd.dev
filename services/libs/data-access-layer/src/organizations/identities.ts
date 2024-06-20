import { QueryExecutor } from '../queryExecutor'
import { IDbOrgIdentity, IDbOrgIdentityInsertInput, IDbOrgIdentityUpdateInput } from './types'

export async function fetchOrgIdentities(
  qx: QueryExecutor,
  organizationId: string,
): Promise<IDbOrgIdentity[]> {
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
): Promise<{ organizationId: string; identities: IDbOrgIdentity[] }[]> {
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

export async function updateOrgIdentityVerifiedFlag(
  qx: QueryExecutor,
  identity: IDbOrgIdentityUpdateInput,
): Promise<void> {
  await qx.result(
    `
    update "organizationIdentities" set verified = $(verified)
    where "organizationId" = $(organizationId) and "tenantId" = $(tenantId) and platform = $(platform) and value = $(value) and type = $(type)
    `,
    identity,
  )
}

export async function addOrgIdentity(qx: QueryExecutor, identity: IDbOrgIdentityInsertInput) {
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
