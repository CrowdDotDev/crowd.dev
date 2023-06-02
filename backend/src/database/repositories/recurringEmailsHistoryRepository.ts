import { generateUUIDv1 as uuid } from '@crowd/common'
import { QueryTypes } from 'sequelize'
import {
  RecurringEmailsHistoryData,
  RecurringEmailType,
} from '../../types/recurringEmailsHistoryTypes'
import { IRepositoryOptions } from './IRepositoryOptions'
import { RepositoryBase } from './repositoryBase'

class RecurringEmailsHistoryRepository extends RepositoryBase<
  RecurringEmailsHistoryData,
  string,
  RecurringEmailsHistoryData,
  unknown,
  unknown
> {
  public constructor(options: IRepositoryOptions) {
    super(options, true)
  }

  /**
   * Inserts recurring emails receipt history.
   * @param data recurring emails historical data
   * @param options
   * @returns
   */
  async create(data: RecurringEmailsHistoryData): Promise<RecurringEmailsHistoryData> {
    const historyInserted = await this.options.database.sequelize.query(
      `INSERT INTO "recurringEmailsHistory" ("id", "type", "tenantId", "weekOfYear", "emailSentAt", "emailSentTo")
          VALUES
              (:id, :type, :tenantId, :weekOfYear, :emailSentAt, ARRAY[:emailSentTo])
          RETURNING "id"
        `,
      {
        replacements: {
          id: uuid(),
          type: data.type,
          tenantId: data.tenantId,
          weekOfYear: data.weekOfYear || null,
          emailSentAt: data.emailSentAt,
          emailSentTo: data.emailSentTo,
        },
        type: QueryTypes.INSERT,
      },
    )

    const emailHistory = await this.findById(historyInserted[0][0].id)
    return emailHistory
  }

  /**
   * Finds a historical entry given tenantId and weekOfYear
   * Returns null if not found.
   * @param tenantId
   * @param weekOfYear
   * @param options
   * @returns
   */
  async findByWeekOfYear(
    tenantId: string,
    weekOfYear: string,
    type: RecurringEmailType,
  ): Promise<RecurringEmailsHistoryData> {
    const records = await this.options.database.sequelize.query(
      `SELECT *
             FROM "recurringEmailsHistory"
             WHERE "tenantId" = :tenantId
             AND "weekOfYear" = :weekOfYear
             and "type" = :type;
            `,
      {
        replacements: {
          tenantId,
          weekOfYear,
          type,
        },
        type: QueryTypes.SELECT,
      },
    )

    if (records.length === 0) {
      return null
    }

    return records[0]
  }

  /**
   * Finds a historical entry by id.
   * Returns null if not found
   * @param id
   * @param options
   * @returns
   */
  async findById(id: string): Promise<RecurringEmailsHistoryData> {
    const records = await this.options.database.sequelize.query(
      `SELECT *
             FROM "recurringEmailsHistory"
             WHERE id = :id;
            `,
      {
        replacements: {
          id,
        },
        type: QueryTypes.SELECT,
      },
    )

    if (records.length === 0) {
      return null
    }

    return records[0]
  }
}

export default RecurringEmailsHistoryRepository
