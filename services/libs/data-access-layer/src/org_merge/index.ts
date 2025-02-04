import { QueryExecutor } from '../queryExecutor'

export async function findOrgNoMergeIds(
  qx: QueryExecutor,
  organizationId: string,
): Promise<string[]> {
  const rows = await qx.select(
    `
      SELECT
        "noMergeId"
      FROM "organizationNoMerge"
      WHERE "organizationId" = $(organizationId)
    `,
    {
      organizationId,
    },
  )

  return rows.map((row: { noMergeId: string }) => row.noMergeId)
}

export async function addOrgNoMerge(
  qx: QueryExecutor,
  organizationId: string,
  noMergeId: string,
): Promise<void> {
  const currentTime = new Date()
  await qx.result(
    `
      INSERT INTO "organizationNoMerge" ("organizationId", "noMergeId", "createdAt", "updatedAt")
      VALUES ($(organizationId), $(noMergeId), $(createdAt), $(updatedAt))
      on conflict ("organizationId", "noMergeId") do nothing
    `,
    {
      organizationId,
      noMergeId,
      createdAt: currentTime,
      updatedAt: currentTime,
    },
  )
}
