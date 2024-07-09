import { IMemberIdentity } from '@crowd/types'
import { QueryExecutor } from '../queryExecutor'

export async function fetchMemberIdentities(
  qx: QueryExecutor,
  memberId: string,
): Promise<IMemberIdentity[]> {
  return qx.select(
    `
      SELECT *
      FROM "memberIdentities"
      WHERE "memberId" = $(memberId)
    `,
    {
      memberId,
    },
  )
}

export async function fetchManyMemberIdentities(
  qx: QueryExecutor,
  memberIds: string[],
): Promise<{ memberId: string; identities: IMemberIdentity[] }[]> {
  return qx.select(
    `
      SELECT
          mi."memberId",
          JSONB_AGG(mi ORDER BY mi."createdAt") AS "identities"
      FROM "memberIdentities" mi
      WHERE mi."memberId" IN ($(memberIds:csv))
      GROUP BY mi."memberId"
    `,
    {
      memberIds,
    },
  )
}
