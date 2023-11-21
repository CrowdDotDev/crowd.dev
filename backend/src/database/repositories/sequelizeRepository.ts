import lodash from 'lodash'
import { Sequelize, UniqueConstraintError } from 'sequelize'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import { Unleash, getUnleashClient } from '@crowd/feature-flags'
import { Edition, SegmentData } from '@crowd/types'
import { SERVICE, Error400 } from '@crowd/common'
import { Client as TemporalClient, getTemporalClient } from '@crowd/temporal'
import { API_CONFIG, IS_TEST_ENV, REDIS_CONFIG, TEMPORAL_CONFIG, UNLEASH_CONFIG } from '../../conf'
import { databaseInit } from '../databaseConnection'
import { IRepositoryOptions } from './IRepositoryOptions'
import { IServiceOptions } from '../../services/IServiceOptions'

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
    let unleash: Unleash | undefined

    if (UNLEASH_CONFIG.url && API_CONFIG.edition === Edition.CROWD_HOSTED) {
      unleash = await getUnleashClient({
        url: UNLEASH_CONFIG.url,
        apiKey: UNLEASH_CONFIG.backendApiKey,
        appName: SERVICE,
      })
    }

    let temporal: TemporalClient | undefined
    if (TEMPORAL_CONFIG.serverUrl) {
      temporal = await getTemporalClient(TEMPORAL_CONFIG)
    }

    return {
      log: getServiceLogger(),
      database: await databaseInit(),
      currentTenant: tenant,
      currentUser: user,
      currentSegments: segments,
      bypassPermissionValidation: true,
      language: 'en',
      redis: await getRedisClient(REDIS_CONFIG, true),
      unleash,
      temporal,
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
        options.transaction.crowdNestedTransactions++
      } else {
        options.transaction.crowdNestedTransactions = 1
      }

      return options.transaction
    }

    return options.database.sequelize.transaction()
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
      transaction.crowdNestedTransactions--
      return Promise.resolve()
    }

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
      transaction.crowdNestedTransactions--
      return Promise.resolve()
    }

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

  static getSegmentIds(options: IRepositoryOptions): string[] {
    return options.currentSegments.map((s) => s.id)
  }
}
