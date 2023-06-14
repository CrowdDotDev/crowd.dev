import lodash from 'lodash'
import { Sequelize, UniqueConstraintError } from 'sequelize'
import { getServiceLogger } from '@crowd/logging'
import { IS_TEST_ENV } from '../../conf'
import Error400 from '../../errors/Error400'
import { databaseInit } from '../databaseConnection'
import { IRepositoryOptions } from './IRepositoryOptions'
import { SegmentData } from '../../types/segmentTypes'
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
    return {
      log: getServiceLogger(),
      database: await databaseInit(),
      currentTenant: tenant,
      currentUser: user,
      currentSegments: segments,
      bypassPermissionValidation: true,
      language: 'en',
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
  static async createTransaction(options) {
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
