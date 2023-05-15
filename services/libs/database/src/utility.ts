import { ITableName } from './types'

export const escapeTableName = (tableName: ITableName): string => {
  return `${
    tableName.schema !== undefined ? `"${tableName.schema.toLowerCase()}".` : ''
  }"${tableName.table.toLowerCase()}"`
}
