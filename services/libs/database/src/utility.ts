import pgp from 'pg-promise'

import { isNullOrUndefined } from '@crowd/common'

import { ITableName } from './types'

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
