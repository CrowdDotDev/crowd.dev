import { QueryExecutor } from '../queryExecutor'
import { prepareBulkInsert } from '../utils'
import { IOrgAttribute, IOrgAttributeInput } from './types'

export async function findOrgAttributes(
  qx: QueryExecutor,
  organizationId: string,
): Promise<IOrgAttribute[]> {
  return qx.select(
    `
    SELECT
      *
    FROM "orgAttributes"
    WHERE "organizationId" = $(organizationId)
  `,
    {
      organizationId,
    },
  )
}

export async function upsertOrgAttributes(
  qx: QueryExecutor,
  organizationId: string,
  attributes: IOrgAttributeInput[],
): Promise<void> {
  const objects = attributes.map((a) => {
    return {
      organizationId,
      ...a,
    }
  })

  await qx.result(
    prepareBulkInsert(
      'orgAttributes',
      ['organizationId', 'type', 'name', 'source', 'default', 'value'],
      objects,
      'DO UPDATE SET value = EXCLUDED.value, default = EXCLUDED.default',
    ),
  )
}
