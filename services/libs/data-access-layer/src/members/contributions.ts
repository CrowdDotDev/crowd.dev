import { IMemberContribution } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export async function updateMemberContributions(
  qx: QueryExecutor,
  memberId: string,
  contributions: IMemberContribution[],
): Promise<void> {
  return qx.result(
    `
          UPDATE "members"
          SET
              contributions = $(contributions)
          WHERE "id" = $(memberId)
      `,
    {
      memberId,
      contributions: JSON.stringify(contributions),
    },
  )
}
