import { QueryExecutor } from '../queryExecutor'

export async function fetchOrgIdentities(qx: QueryExecutor, organizationId: string) {
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
  { organizationIds, tenantId }: { organizationIds: string[]; tenantId: string },
) {
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

export async function cleanUpOrgIdentities(qx: QueryExecutor, { organizationId, tenantId }) {
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
  { organizationId, tenantId, platform, value, type, verified },
): Promise<void> {
  await qx.result(
    `
    update "organizationIdentities" set verified = $(verified)
    where "organizationId" = $(organizationId) and "tenantId" = $(tenantId) and platform = $(platform) and value = $(value) and type = $(type)
    `,
    {
      organizationId,
      tenantId,
      platform,
      value,
      type,
      verified,
    },
  )
}

export async function addOrgIdentity(
  qx: QueryExecutor,
  { organizationId, platform, value, type, verified, sourceId, tenantId, integrationId },
) {
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
    {
      organizationId,
      platform,
      value,
      type,
      verified,
      sourceId,
      tenantId,
      integrationId,
    },
  )
}
