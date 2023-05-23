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
