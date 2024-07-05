import { IMemberOrganization } from '@crowd/types'
import { QueryExecutor } from '../queryExecutor'

export async function fetchMemberOrganizations(
  qx: QueryExecutor,
  memberId: string,
): Promise<IMemberOrganization[]> {
  return qx.select(
    `
      SELECT *
      FROM "memberOrganizations"
      WHERE "memberId" = $(memberId)
    `,
    {
      memberId,
    },
  )
}
