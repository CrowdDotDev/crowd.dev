import { Logger, LoggerBase, logError } from '@crowd/logging'
import { getDbInstance } from './connection'
import { lockTable, lockTableRow } from './locking'
import {
  DbConnection,
  DbInstance,
  DbTransaction,
  ITableName,
  RowLockStrength,
  TableLockLevel,
} from './types'

export class DbStore extends LoggerBase {
  public readonly dbInstance: DbInstance
  constructor(
    parentLog?: Logger,
    private readonly dbConnection?: DbConnection,
    private readonly dbTransaction?: DbTransaction,
    private readonly withTransactions: boolean = true,
  ) {
    super(parentLog, { transactional: dbTransaction !== undefined })

    this.dbInstance = getDbInstance()
  }

  private checkValid() {
    if (this.dbConnection === undefined && this.dbTransaction === undefined) {
      throw logError(this.log, new Error('Store is not valid! No valid connection found!'))
    }
  }

  public isTransaction(): boolean {
    return this.dbTransaction !== undefined
  }

  public connection(): DbConnection | DbTransaction {
    this.checkValid()
    return this.isTransaction()
      ? <DbTransaction>this.dbTransaction
      : <DbConnection>this.dbConnection
  }

  public transaction(): DbTransaction {
    this.checkValid()
    if (this.isTransaction()) {
      return <DbTransaction>this.dbTransaction
    }

    throw logError(this.log, new Error('Store is not in transaction!'))
  }

  public transactionally<T>(inTransaction: (store: DbStore) => Promise<T>): Promise<T> {
    this.checkValid()

    if (!this.withTransactions) {
      return inTransaction(this)
    }

    if (this.isTransaction()) {
      this.log.debug('Using an existing transaction!')
      return inTransaction(this)
    }

    if (this.dbConnection !== undefined) {
      this.log.debug('Creating a new transaction!')
      return this.dbConnection.tx((t: DbTransaction) => {
        return inTransaction(new DbStore(this.log, undefined, t))
      })
    }

    throw logError(this.log, new Error('Store does not have a valid database connection!'))
  }

  public async lockTable(
    tableName: ITableName,
    lockLevel: TableLockLevel,
    withChildTables = false,
  ): Promise<void> {
    if (this.isTransaction()) {
      await lockTable(this.connection() as DbTransaction, tableName, lockLevel, withChildTables)
    } else {
      throw logError(
        this.log,
        new Error(
          `Could not lock table '${tableName.schema || 'public'}.${
            tableName.table
          }' because store is not in transaction!`,
        ),
      )
    }
  }

  public async lockTableRow(
    tableName: ITableName,
    idColumns: string[],
    ids: unknown[],
    lockStrength: RowLockStrength,
  ): Promise<void> {
    if (this.isTransaction()) {
      await lockTableRow(
        this.connection() as DbTransaction,
        tableName,
        idColumns,
        ids,
        lockStrength,
      )
    } else {
      throw logError(
        this.log,
        new Error(
          `Could not lock table '${tableName.schema || 'public'}.${
            tableName.table
          }' row with ids [${ids.join(',')}] because store is not in transaction!`,
        ),
      )
    }
  }
}
