import { getServiceChildLogger } from '@crowd/logging'
import { DbTransaction, ITableName, TableLockLevel } from './types'
import { escapeTableName } from './utility'
import { RowLockStrength } from './types'

const log = getServiceChildLogger('database.locking')

export const lockTable = async (
  tx: DbTransaction,
  table: ITableName,
  lockLevel: TableLockLevel,
  withChildTables = false,
): Promise<void> => {
  try {
    const query = `lock table ${withChildTables ? '' : 'only'} ${escapeTableName(
      table,
    )} in ${lockLevel} mode`
    log.debug({ table, lockLevel, withChildTables, query }, 'Locking table!')

    await tx.none(query)
    log.debug({ table, lockLevel, withChildTables, query }, 'Table locked!')
  } catch (err) {
    log.error(err, { table, lockLevel, withChildTables }, 'Error while locking table!')

    throw err
  }
}

export const lockTableRow = async (
  tx: DbTransaction,
  table: ITableName,
  idColumns: string[],
  ids: unknown[],
  lockStrength: RowLockStrength,
): Promise<void> => {
  try {
    const condition = idColumns
      .map((idColumn, index) => `"${idColumn}" = $${index + 1}`)
      .join(' and ')
    const query = `select 1 from ${escapeTableName(table)} where ${condition} for ${lockStrength}`
    log.debug({ table, idColumns, ids, lockStrength, query }, 'Locking table row!')
    const result = await tx.result(query, ids)
    if (result.rowCount === 0) {
      throw new Error('No rows were locked!')
    }
    log.debug({ table, idColumns, ids, lockStrength, query }, 'Table row locked!')
  } catch (err) {
    log.error(err, { table, idColumns, ids, lockStrength }, 'Error while locking table row!')
    throw err
  }
}
