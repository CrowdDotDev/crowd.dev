import lodash from 'lodash'
import { Sequelize, Transaction, UniqueConstraintError } from 'sequelize'

import { Error400, generateUUIDv1 } from '@crowd/common'
import { DbConnection, getDbConnection } from '@crowd/data-access-layer/src/database'
import {
  QueryExecutor,
  SequelizeQueryExecutor,
  TransactionalSequelizeQueryExecutor,
} from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceChildLogger, getServiceLogger } from '@crowd/logging'
import { getOpensearchClient } from '@crowd/opensearch'
import { getClientSQL } from '@crowd/questdb'
import { getRedisClient } from '@crowd/redis'
import { Client as TemporalClient, getTemporalClient } from '@crowd/temporal'
import { SegmentData } from '@crowd/types'

import {
  IS_TEST_ENV,
  OPENSEARCH_CONFIG,
  PRODUCT_DB_CONFIG,
  REDIS_CONFIG,
  TEMPORAL_CONFIG,
} from '../../conf'
import { IServiceOptions } from '../../services/IServiceOptions'
import { databaseInit } from '../databaseConnection'

import { IRepositoryOptions } from './IRepositoryOptions'

const logger = getServiceChildLogger('SequelizeRepository')

/**
 * Abstracts some basic Sequelize operations.
 * See https://sequelize.org/v5/index.html to learn how to customize it.
 */
export default class SequelizeRepository {
  /**
   * Cleans the database.
   */
  static async cleanDatabase(database) {
    if (!IS_TEST_ENV) {
      throw new Error('Clean database only allowed for test!')
    }

    await database.sequelize.sync({ force: true })
  }

  static async getDefaultIRepositoryOptions(
    user?,
    tenant?,
    segments?,
  ): Promise<IRepositoryOptions> {
    let temporal: TemporalClient | undefined
    if (TEMPORAL_CONFIG.serverUrl) {
      temporal = await getTemporalClient(TEMPORAL_CONFIG)
    }

    let productDb: DbConnection | undefined
    if (PRODUCT_DB_CONFIG) {
      productDb = await getDbConnection(PRODUCT_DB_CONFIG)
    }

    const qdb = await getClientSQL()

    const opensearch = await getOpensearchClient(OPENSEARCH_CONFIG)

    return {
      log: getServiceLogger(),
      database: await databaseInit(),
      currentTenant: tenant,
      currentUser: user,
      currentSegments: segments,
      bypassPermissionValidation: true,
      language: 'en',
      redis: await getRedisClient(REDIS_CONFIG, true),
      temporal,
      productDb,
      qdb,
      opensearch,
    }
  }

  /**
   * Returns the currentUser if it exists on the options.
   */
  static getCurrentUser(options: IRepositoryOptions) {
    return (options && options.currentUser) || { id: null }
  }

  /**
   * Returns the tenant if it exists on the options.
   */
  static getCurrentTenant(options: IRepositoryOptions) {
    return (options && options.currentTenant) || { id: null }
  }

  static getCurrentSegments(options: IRepositoryOptions) {
    return (options && options.currentSegments) || []
  }

  static getStrictlySingleActiveSegment(
    options: IRepositoryOptions | IServiceOptions,
  ): SegmentData {
    if (options.currentSegments.length !== 1) {
      throw new Error400(
        `This operation can have exactly one segment. Found ${options.currentSegments.length} segments.`,
      )
    }
    return options.currentSegments[0]
  }

  /**
   * Returns the transaction if it exists on the options.
   */
  static getTransaction(options: IRepositoryOptions) {
    return (options && options.transaction) || undefined
  }

  /**
   * Creates a database transaction.
   */
  static async createTransaction(options: IRepositoryOptions) {
    if (options.transaction) {
      if (options.transaction.crowdNestedTransactions !== undefined) {
        options.log.info(`Incrementing nested transaction for '${options.transaction._cm_tx_id}'!`)
        options.transaction.crowdNestedTransactions++
      } else {
        options.log.info(`Setting nested transactions to 1 for '${options.transaction._cm_tx_id}'!`)
        options.transaction.crowdNestedTransactions = 1
      }

      options.log.info(`Returning existing transaction '${options.transaction._cm_tx_id}'!`)
      return options.transaction
    }

    const tx = options.database.sequelize.transaction()

    const id = generateUUIDv1()
    options.log.info(`Creating transaction '${id}'!`)

    const actual = { ...tx, _cm_tx_id: id }

    return actual
  }

  static async withTx<T>(options: IRepositoryOptions, fn: (tx: Transaction) => Promise<T>) {
    const tx = await this.createTransaction(options)
    try {
      const result = await fn(tx)
      await this.commitTransaction(tx)
      return result
    } catch (error) {
      await this.rollbackTransaction(tx)
      throw error
    }
  }

  /**
   * Creates a transactional repository options instance
   */
  static async createTransactionalRepositoryOptions(
    options: IRepositoryOptions,
  ): Promise<IRepositoryOptions> {
    const transaction = await this.createTransaction(options)

    return {
      ...options,
      transaction,
    }
  }

  /**
   * Commits a database transaction.
   */
  static async commitTransaction(transaction) {
    if (
      transaction.crowdNestedTransactions !== undefined &&
      transaction.crowdNestedTransactions > 0
    ) {
      logger.info(`Decrementing nested transactions for '${transaction._cm_tx_id}'!`)
      transaction.crowdNestedTransactions--
      return Promise.resolve()
    }

    logger.info(`Committing transaction '${transaction._cm_tx_id}'!`)
    return transaction.commit()
  }

  /**
   * Rolls back a database transaction.
   */
  static async rollbackTransaction(transaction) {
    if (
      transaction.crowdNestedTransactions !== undefined &&
      transaction.crowdNestedTransactions > 0
    ) {
      logger.info(`Decrementing nested transactions for '${transaction._cm_tx_id}'!`)
      transaction.crowdNestedTransactions--
      return Promise.resolve()
    }

    logger.info(`Rolling back transaction '${transaction._cm_tx_id}'!`)
    return transaction.rollback()
  }

  static handleUniqueFieldError(error, language, entityName) {
    if (!(error instanceof UniqueConstraintError)) {
      return
    }

    const fieldName = lodash.get(error, 'errors[0].path')
    throw new Error400(language, `entities.${entityName}.errors.unique.${fieldName}`)
  }

  static getSequelize(options: IRepositoryOptions): Sequelize {
    return options.database.sequelize as Sequelize
  }

  static getQueryExecutor(options: IRepositoryOptions): QueryExecutor {
    const seq = this.getSequelize(options)
    const transaction = this.getTransaction(options)
    return transaction
      ? new TransactionalSequelizeQueryExecutor(seq, transaction)
      : new SequelizeQueryExecutor(seq)
  }

  static getSegmentIds(options: IRepositoryOptions): string[] {
    return options.currentSegments.map((s) => s.id)
  }
}
