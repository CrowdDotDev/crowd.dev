import { IMemberReach } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export async function updateMemberReach(
  qx: QueryExecutor,
  memberId: string,
  reach: IMemberReach,
): Promise<void> {
  await qx.result(
    `
          UPDATE "members"
          SET
              reach = $(reach)
          WHERE "id" = $(memberId)
      `,
    {
      memberId,
      reach,
    },
  )
}

export async function touchMemberUpdatedAt(qx: QueryExecutor, memberId: string): Promise<void> {
  await qx.result(`UPDATE members SET "updatedAt" = NOW() WHERE id = $(memberId)`, { memberId })
}

export async function getMemberManuallyChangedFields(
  qx: QueryExecutor,
  memberId: string,
): Promise<string[]> {
  const result = await qx.select(
    `
      SELECT "manuallyChangedFields"
      FROM "members"
      WHERE "id" = $(memberId);
    `,
    { memberId },
  )

  return result[0]?.manuallyChangedFields ?? []
}

export async function setMemberManuallyChangedFields(
  qx: QueryExecutor,
  memberId: string,
  fields: string[],
): Promise<void> {
  await qx.result(
    `
      UPDATE "members"
      SET "manuallyChangedFields" = $(fields)
      WHERE "id" = $(memberId)
    `,
    {
      memberId,
      fields,
    },
  )
}
