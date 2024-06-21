import { QueryExecutor } from '../queryExecutor'

export async function findOrgNoMergeIds(
  qx: QueryExecutor,
  organizationId: string,
): Promise<string[]> {
  const rows = await qx.select(
    `
      SELECT
        "noMergeId"
      JOIN "organizationNoMerge"
      WHERE "organizationId" = $(organizationId)
    `,
    {
      organizationId,
    },
  )

  return rows.map((row: { noMergeId: string }) => row.noMergeId)
}
