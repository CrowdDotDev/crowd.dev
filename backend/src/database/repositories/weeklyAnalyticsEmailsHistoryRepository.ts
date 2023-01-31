import { v4 as uuid } from 'uuid'
import { QueryTypes } from 'sequelize'
import { WeeklyAnalyticsEmailsHistoryData } from '../../types/weeklyAnalyticsEmailsHistoryTypes'
import { IRepositoryOptions } from './IRepositoryOptions'
import { RepositoryBase } from './repositoryBase'

class WeeklyAnalyticsEmailsHistoryRepository extends RepositoryBase<
  WeeklyAnalyticsEmailsHistoryData,
  string,
  WeeklyAnalyticsEmailsHistoryData,
  unknown,
  unknown
> {
  public constructor(options: IRepositoryOptions) {
    super(options, true)
  }

  /**
   * Inserts weekly analytics email history
   * If there is already a historical entry for given tenant and weekOfYear,
   * returns the already existing entry.
   * @param data weekly emails historical data
   * @param options
   * @returns
   */
  async create(data: WeeklyAnalyticsEmailsHistoryData): Promise<WeeklyAnalyticsEmailsHistoryData> {
    const historyInserted = await this.options.database.sequelize.query(
      `INSERT INTO "weeklyAnalyticsEmailsHistory" ("id", "tenantId", "weekOfYear", "emailSentAt", "emailSentTo")
          VALUES
              (:id, :tenantId, :weekOfYear, :emailSentAt, ARRAY[:emailSentTo])
          RETURNING "id"
        `,
      {
        replacements: {
          id: uuid(),
          tenantId: data.tenantId,
          weekOfYear: data.weekOfYear,
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
  async findByWeekOfYear(weekOfYear: string): Promise<WeeklyAnalyticsEmailsHistoryData> {
    const records = await this.options.database.sequelize.query(
      `SELECT *
             FROM "weeklyAnalyticsEmailsHistory"
             WHERE "tenantId" = :tenantId
             AND "weekOfYear" = :weekOfYear;
            `,
      {
        replacements: {
          tenantId: this.options.currentTenant.id,
          weekOfYear,
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
  async findById(id: string): Promise<WeeklyAnalyticsEmailsHistoryData> {
    const records = await this.options.database.sequelize.query(
      `SELECT *
             FROM "weeklyAnalyticsEmailsHistory"
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

export default WeeklyAnalyticsEmailsHistoryRepository
