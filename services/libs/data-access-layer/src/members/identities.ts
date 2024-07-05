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
