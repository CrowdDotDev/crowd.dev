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
  { organizationId, platform, name, url, sourceId, tenantId, integrationId },
) {
  return qx.result(
    `
      INSERT INTO "organizationIdentities" (
        "organizationId",
        "platform",
        "name",
        "url",
        "sourceId",
        "tenantId",
        "integrationId",
        "createdAt"
      )
      VALUES ($(organizationId), $(platform), $(name), $(url), $(sourceId), $(tenantId), $(integrationId), NOW())
      ON CONFLICT DO NOTHING;
    `,
    {
      organizationId,
      platform,
      name,
      url,
      sourceId,
      tenantId,
      integrationId,
    },
  )
}
