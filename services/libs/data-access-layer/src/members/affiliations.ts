import { IMemberAffiliation } from '@crowd/types'
import { QueryExecutor } from '../queryExecutor'

export async function fetchMemberAffiliations(
  qx: QueryExecutor,
  memberId: string,
): Promise<IMemberAffiliation[]> {
  return qx.select(
    `
        SELECT
          id,
          "dateStart",
          "dateEnd",
          "organizationId",
          "segmentId"
        FROM "memberSegmentAffiliations"
        WHERE "memberId" = $(memberId)
      `,
    {
      memberId,
    },
  )
}
