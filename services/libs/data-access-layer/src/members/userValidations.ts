import { QueryExecutor } from '../queryExecutor'

import {
  IMemberUserValidation,
  IMemberUserValidationFilter,
  IMemberUserValidationRecord,
} from './types'

export async function createMemberUserValidation<T>(
  qx: QueryExecutor,
  memberId: string,
  data: IMemberUserValidationRecord<T>,
): Promise<IMemberUserValidation> {
  return qx.selectOne(
    `
    INSERT INTO "memberUserValidations" ("memberId", "action", "type", "details")
    VALUES ($(memberId), $(action), $(type), $(details)) 
    RETURNING *
  `,
    {
      memberId,
      action: data.action,
      type: data.type,
      details: data.details,
    },
  )
}

export async function getMemberUserValidations(
  qx: QueryExecutor,
  memberId: string,
  filter: IMemberUserValidationFilter,
): Promise<IMemberUserValidation[]> {
  const where: string[] = ['"memberId" = $(memberId)']

  if (filter.action) {
    where.push('"action" = $(action)')
  }

  if (filter.type) {
    where.push('"type" = $(type)')
  }

  const result = await qx.result(
    `SELECT * FROM "memberUserValidations" 
    WHERE ${where.join(' AND ')}`,
    {
      memberId,
      action: filter.action,
      type: filter.type,
    },
  )

  return Array.isArray(result.rows) ? result.rows : []
}
