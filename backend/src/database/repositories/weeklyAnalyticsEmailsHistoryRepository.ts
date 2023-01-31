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
>{
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
    async create(
        data: WeeklyAnalyticsEmailsHistoryData
    ): Promise<WeeklyAnalyticsEmailsHistoryData> {

        await this.options.database.sequelize.query(
            `INSERT INTO "weeklyAnalyticsEmailsHistory" ("tenantId", "weekOfYear", "emailSentAt", "emailSentTo")
          VALUES
              (:tenantId, :weekOfYear, :emailSentAt, ARRAY[:emailSentTo])
          ON CONFLICT ("weekOfYear", "tenantId") DO NOTHING
        `,
            {
                replacements: {
                    tenantId: data.tenantId,
                    weekOfYear: data.weekOfYear,
                    emailSentAt: data.emailSentAt,
                    emailSentTo: data.emailSentTo
                },
                type: QueryTypes.UPSERT,
            },
        )

        const emailHistory = await this.find(data.tenantId, data.weekOfYear)
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
    async find(
        tenantId: string,
        weekOfYear: string,
    ): Promise<WeeklyAnalyticsEmailsHistoryData> {
        const records = await this.options.database.sequelize.query(
            `SELECT *
             FROM "weeklyAnalyticsEmailsHistory"
             WHERE "tenantId" = :tenantId
             AND "weekOfYear" = :weekOfYear;
            `,
            {
                replacements: {
                    tenantId,
                    weekOfYear
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
