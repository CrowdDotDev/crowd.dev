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
): Promise<string | null> {
  const displayNameClause = exact
    ? '"displayName" = $(displayName)'
    : '"displayName" ILIKE $(displayName)'

  const result = await qx.selectOneOrNone(
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

  if (result) {
    return result.id
  }

  return null
}

export async function findOrgByWebsite(
  qx: QueryExecutor,
  tenantId: string,
  websites: string[],
): Promise<string | null> {
  const result = await qx.selectOneOrNone(
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

  if (result) {
    return result.id
  }

  return null
}
