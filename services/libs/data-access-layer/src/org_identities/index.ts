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
