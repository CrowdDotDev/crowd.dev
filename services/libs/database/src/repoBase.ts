import { Logger, LoggerBase, logError } from '@crowd/logging'
import { partition } from '@crowd/common'
import { DbColumnSet, DbConnection, DbInstance, DbTransaction } from './types'
import { DbStore } from './dbStore'

export abstract class RepositoryBase<TRepo extends RepositoryBase<TRepo>> extends LoggerBase {
  private database: DbConnection | DbTransaction
  private inTransaction: boolean
  protected readonly dbInstance: DbInstance

  protected constructor(protected readonly store: DbStore, parentLog: Logger) {
    super(parentLog)

    this.database = store.connection()
    this.dbInstance = store.dbInstance
    this.inTransaction = store.isTransaction()
  }

  public db(): DbConnection | DbTransaction {
    return this.database
  }

  public isTransactional(): boolean {
    return this.inTransaction
  }

  public ensureTransactional() {
    if (!this.isTransactional()) {
      throw new Error('Process should be run in transaction!')
    }
  }

  public transactional(transaction: DbTransaction): TRepo {
    if (this.isTransactional()) {
      throw new Error('Repository is already in transaction!')
    }

    const cloned: TRepo = this.clone()

    cloned.database = transaction
    cloned.inTransaction = true

    return cloned
  }

  public async transactionally<T>(
    process: (repo: TRepo) => Promise<T> | T,
    transaction?: DbTransaction,
  ): Promise<T> {
    if (this.isTransactional() && transaction === undefined) {
      return process(this as unknown as TRepo)
    }

    const cloned: TRepo = this.clone()
    cloned.inTransaction = true

    if (transaction !== undefined) {
      cloned.database = transaction
      return process(cloned)
    }

    return this.store.transactionally(async (store) => {
      cloned.database = store.connection() as DbTransaction
      return process(cloned)
    })
  }

  private clone(): TRepo {
    // clone prototype to get functions
    const cloned = Object.create(this as unknown as TRepo)
    // clone properties to get a shallow copy
    return Object.assign(cloned, this)
  }

  protected batchInsert(
    entities: unknown[],
    columnSet: DbColumnSet,
    prepare = true,
  ): Promise<void> {
    const prepared = prepare ? RepositoryBase.prepareBatch(entities, columnSet) : entities
    return this.batchOperation(prepared, (batch) =>
      this.dbInstance.helpers.insert(batch, columnSet),
    )
  }

  protected async batchUpdate(
    entities: unknown[],
    columnSet: DbColumnSet,
    prepare = true,
  ): Promise<void> {
    const prepared = prepare ? RepositoryBase.prepareBatch(entities, columnSet) : entities
    return this.batchOperation(prepared, (batch) =>
      this.dbInstance.helpers.update(batch, columnSet),
    )
  }

  private async batchOperation(
    preparedEntities: unknown[],
    queryGenerator: (batch: unknown[]) => string,
  ): Promise<void> {
    if (preparedEntities.length > 999) {
      const batches = partition(preparedEntities, 999)

      for (const batch of batches) {
        const query = queryGenerator(batch)
        const result = await this.db().result(query)
        if (result.rowCount !== batch.length) {
          this.log.error(
            {
              entities: preparedEntities,
              expectedRowCount: batch.length,
              actualRowCount: result.rowCount,
            },
            'Updated row count does not match the expected row count! Partitioned query!',
          )
          throw new Error(
            'Updated row count does not match the expected row count! Partitioned query!',
          )
        }
      }
    } else {
      const query = queryGenerator(preparedEntities)
      const result = await this.db().result(query)
      if (result.rowCount !== preparedEntities.length) {
        this.log.error(
          {
            entities: preparedEntities,
            expectedRowCount: preparedEntities.length,
            actualRowCount: result.rowCount,
          },
          'Updated row count does not match the expected row count!',
        )
        throw new Error('Updated row count does not match the expected row count!')
      }
    }
  }

  public static prepareBatch<T>(entities: T[], columnSet: DbColumnSet): T[] {
    return entities.map((e) => this.prepare(e, columnSet))
  }

  public static prepare<T>(entity: T, columnSet: DbColumnSet): T {
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

  protected checkUpdateRowCount(rowCount: number, expected: number) {
    if (rowCount !== expected) {
      throw logError(
        this.log,
        new Error(
          `Updated number of rows (${rowCount}) not equal to expected number (${expected})!`,
        ),
      )
    }
  }

  protected format(condition: string, params: unknown): string {
    return this.dbInstance.as.format(condition, params)
  }
}
