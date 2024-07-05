import { RawQueryParser } from '@crowd/common'
import { QueryExecutor } from '../queryExecutor'
import { QueryOptions } from '../utils'

export enum MemberField {
  // meta
  ID = 'id',
  ATTRIBUTES = 'attributes',
  DISPLAY_NAME = 'displayName',
  SCORE = 'score',
  JOINED_AT = 'joinedAt',
  IMPORT_HASH = 'importHash',
  REACH = 'reach',
  CONTRIBUTIONS = 'contributions',

  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  DELETED_AT = 'deletedAt',

  TENANT_ID = 'tenantId',
  CREATED_BY_ID = 'createdById',
  UPDATED_BY_ID = 'updatedById',

  ENRICHED_BY = 'enrichedBy',
  LAST_ENRICHED_AT = 'lastEnrichedAt',
  SEARCH_SYNCED_AT = 'searchSyncedAt',

  MANUALLY_CREATED = 'manuallyCreated',
  MANUALLY_CHANGED_FIELDS = 'manuallyChangedFields',
}

export async function queryMembers<T extends MemberField[]>(
  qx: QueryExecutor,
  { filter, fields, limit, offset }: QueryOptions<T> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ [K in T[number]]: any }[]> {
  const params = {
    limit: limit || 10,
    offset: offset || 0,
  }
  if (!fields) {
    fields = Object.values(MemberField) as T
  }
  if (!filter) {
    filter = {}
  }

  const where = RawQueryParser.parseFilters(
    filter,
    new Map<string, string>(Object.values(MemberField).map((field) => [field, field])),
    [],
    params,
    { pgPromiseFormat: true },
  )

  return qx.select(
    `
      SELECT
        ${fields.map((f) => `"${f}"`).join(',\n')}
      FROM members
      WHERE ${where}
      LIMIT $(limit)
      OFFSET $(offset)
    `,
    params,
  )
}

export async function findMemberById<T extends MemberField[]>(
  qx: QueryExecutor,
  memberId: string,
  {
    fields,
  }: {
    fields?: T
  } = {
    fields: Object.values(MemberField) as T,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ [K in T[number]]: any }> {
  const rows = await queryMembers(qx, {
    fields,
    filter: {
      [MemberField.ID]: { eq: memberId },
    },
    limit: 1,
  })

  if (rows.length > 0) {
    return rows[0]
  }

  return null
}
