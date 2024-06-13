import { QueryExecutor } from '../queryExecutor'

export async function findOrgByDisplayName(
  qx: QueryExecutor,
  {
    tenantId,
    orgName,
    exact = false,
  }: {
    tenantId: string
    orgName: string
    exact: boolean
  },
): Promise<{ id: string }> {
  const displayNameClause = exact
    ? '"displayName" = $(displayName)'
    : '"displayName" ILIKE $(displayName)'

  return await qx.selectOneOrNone(
    `
      SELECT id
      FROM organizations
      WHERE ${displayNameClause}
        AND "tenantId" = $(tenantId)
        AND "deletedAt" IS NULL
      LIMIT 1;
    `,
    {
      displayName: exact ? orgName : `%${orgName}%`,
      tenantId,
    },
  )
}

export async function findOrgByWebsite(
  qx: QueryExecutor,
  tenantId: string,
  websites: string[],
): Promise<{ id: string }> {
  return await qx.selectOneOrNone(
    `
      SELECT id
      FROM organizations
      WHERE "website" = ANY($(websites))
        AND "tenantId" = $(tenantId)
        AND "deletedAt" IS NULL
      LIMIT 1;
    `,
    {
      websites,
      tenantId,
    },
  )
}
