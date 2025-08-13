import pgp from 'pg-promise'

import { isNullOrUndefined } from '@crowd/common'

import { getDbInstance } from './connection'
import { DbColumnSet, ITableName } from './types'

export const escapeTableName = (tableName: ITableName): string => {
  return `${
    tableName.schema !== undefined ? `"${tableName.schema.toLowerCase()}".` : ''
  }"${tableName.table.toLowerCase()}"`
}

export const arePrimitivesDbEqual = (a: unknown, b: unknown): boolean => {
  if (isNullOrUndefined(a) && isNullOrUndefined(b)) {
    return true
  }

  return a === b
}

export const eqOrNull = (value: string) => ({
  rawType: true,
  toPostgres: () =>
    pgp.as.format(`${value === null || value === undefined ? 'IS NULL' : '= $1'}`, value),
})

export function prepareForModification<T>(entity: T, columnSet: DbColumnSet): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj: any = {}

  for (const column of columnSet.columns) {
    const value = (entity as unknown as Record<string, unknown>)[column.name]
    if (value !== undefined) {
      obj[column.name] = value
    } else {
      obj[column.name] = undefined
    }
  }

  return obj
}

export function prepareBatchForModification<T>(entities: T[], columnSet: DbColumnSet): T[] {
  return entities.map((e) => prepareForModification(e, columnSet))
}

export function formatSql(condition: string, params: unknown): string {
  return getDbInstance().as.format(condition, params)
}

export function prepareForInsert(prepared: object, columnSet: DbColumnSet): string {
  return getDbInstance().helpers.insert(prepared, columnSet)
}

export function prepareForUpdate(prepared: object, columnSet: DbColumnSet): string {
  return getDbInstance().helpers.update(prepared, columnSet)
}
