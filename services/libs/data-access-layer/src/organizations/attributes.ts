import { uniq } from 'lodash'
import { getServiceChildLogger } from '@crowd/logging'
import { QueryExecutor } from '../queryExecutor'
import { prepareBulkInsert } from '../utils'
import { IDbOrgAttribute, IDbOrgAttributeInput } from './types'

const log = getServiceChildLogger('organizations/attributes')

export async function findOrgAttributes(
  qx: QueryExecutor,
  organizationId: string,
): Promise<IDbOrgAttribute[]> {
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

export async function findManyOrgAttributes(
  qx: QueryExecutor,
  organizationIds: string[],
): Promise<{ organizationId: string; attributes: IDbOrgAttribute[] }[]> {
  return qx.select(
    `
      SELECT
        oa."organizationId",
        JSONB_AGG(oa ORDER BY oa."createdAt") AS "attributes"
      FROM "orgAttributes" oa
      WHERE oa."organizationId" IN ($(organizationIds:csv))
      GROUP BY oa."organizationId"
    `,
    {
      organizationIds,
    },
  )
}

export const upsertOrgAttributes = async (
  qx: QueryExecutor,
  organizationId: string,
  attributes: IDbOrgAttributeInput[],
): Promise<void> => {
  if (attributes.length === 0) {
    return
  }

  const objects = uniq(attributes).map((a) => {
    return {
      organizationId,
      ...a,
    }
  })

  try {
    const prepared = prepareBulkInsert(
      'orgAttributes',
      ['organizationId', 'type', 'name', 'source', 'default', 'value'],
      objects,
      `
        ("organizationId", name, "default") where "default" do update set
           type = excluded.type,
           value = excluded.value,
           "default" = excluded.default,
           "source" = excluded.source
      `,
    )
    await qx.result(prepared)
  } catch (err) {
    log.error(err, 'Failed to upsert organization attributes!')
    throw err
  }
}

export async function deleteOrgAttributes(qx: QueryExecutor, ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return
  }

  await qx.result(
    `
    DELETE FROM "orgAttributes"
    WHERE id IN ($(ids:csv))
  `,
    { ids },
  )
}
