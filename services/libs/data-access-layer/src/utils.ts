import pgp from 'pg-promise'

import { RawQueryParser } from '@crowd/common'
import { DbConnOrTx } from '@crowd/database'

import { QueryFilter } from './query'
import { QueryExecutor } from './queryExecutor'

export function prepareBulkInsert(
  table: string,
  columns: string[],
  objects: object[],
  onConflict?: string,
) {
  const preparedObjects = objects.map((_, r) => {
    return `(${columns.map((_, c) => `$(rows.r${r}_c${c})`).join(',')})`
  })

  let onConflictClause = ''
  if (onConflict) {
    onConflictClause = `ON CONFLICT ${onConflict}`
  }

  return pgp.as.format(
    `
      INSERT INTO $(table:name) (${columns.map((_, i) => `$(columns.col${i}:name)`).join(',')})
      VALUES ${preparedObjects.join(',')}
      ${onConflictClause}
    `,
    {
      table,
      columns: columns.reduce((acc, c, i) => {
        acc[`col${i}`] = c
        return acc
      }, {}),
      rows: objects.reduce((acc, row, r) => {
        columns.forEach((c, i) => {
          acc[`r${r}_c${i}`] = row[c]
        })
        return acc
      }, {}),
    },
  )
}

export function checkUpdateRowCount(rowCount: number, expected: number) {
  if (rowCount !== expected) {
    new Error(`Updated number of rows (${rowCount}) not equal to expected number (${expected})!`)
  }
}

export function prepareSelectColumns(columns: string[], alias?: string) {
  return columns
    .map((c) => {
      return alias ? `${alias}."${c}"` : `"${c}"`
    })
    .join(',\n')
}

export interface QueryOptions<T> {
  limit?: number
  offset?: number
  fields?: T[]
  filter?: QueryFilter
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryResult<T extends string | number | symbol> = { [K in T]: any }

export async function queryTable<T extends string>(
  qx: QueryExecutor,
  table: string,
  allFields: string[],
  opts: QueryOptions<T>,
): Promise<QueryResult<T>[]> {
  const params = {
    limit: opts.limit,
    offset: opts.offset,
    table,
  }

  if (!opts.filter) {
    opts.filter = {}
  }

  const data = allFields.map((field) => [field, field] as [string, string])

  const where = RawQueryParser.parseFilters(
    opts.filter,
    new Map<string, string>(data),
    [],
    params,
    { pgPromiseFormat: true },
  )

  return qx.select(
    `
      SELECT
        ${opts.fields.map((f) => `"${f}"`).join(',\n')}
      FROM $(table:name)
      WHERE ${where}
      ${opts.limit ? 'LIMIT $(limit)' : ''}
      ${opts.offset ? 'OFFSET $(offset)' : ''}
    `,
    params,
  )
}

export async function queryTableById<T extends string>(
  qx: QueryExecutor,
  table: string,
  allFields: string[],
  id: string,
  fields: T[],
): Promise<{ [K in T]: unknown }> {
  const rows = await queryTable(qx, table, allFields, {
    fields,
    filter: {
      id: { eq: id },
    },
    limit: 1,
  })

  if (rows.length > 0) {
    return rows[0]
  }

  return null
}

export async function refreshMaterializedView(
  tx: DbConnOrTx,
  mvName: string,
  concurrently = false,
) {
  await tx.query(`REFRESH MATERIALIZED VIEW ${concurrently ? 'concurrently' : ''} "${mvName}"`)
}
