import { IAttributes } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export async function fetchMemberAttributes(
  qx: QueryExecutor,
  memberId: string,
): Promise<IAttributes> {
  const result = await qx.select(
    `
      SELECT attributes
      FROM "members"
      WHERE "id" = $(memberId)
      LIMIT 1;
    `,
    {
      memberId,
    },
  )

  return result[0]?.attributes
}

export async function updateMemberAttributes(
  qx: QueryExecutor,
  memberId: string,
  attributes: IAttributes,
): Promise<void> {
  return qx.result(
    `
          UPDATE "members"
          SET
              attributes = $(attributes)
          WHERE "id" = $(memberId)
      `,
    {
      memberId,
      attributes,
    },
  )
}
