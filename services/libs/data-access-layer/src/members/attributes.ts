import { IAttributes, IMember } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export async function fetchMemberAttributes(
  qx: QueryExecutor,
  memberId: string,
): Promise<Partial<IMember>[]> {
  return qx.select(
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
