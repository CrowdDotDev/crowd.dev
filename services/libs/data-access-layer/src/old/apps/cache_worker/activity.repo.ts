import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IPlatforms } from './types'

class ActivityRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
  ) {}

  async findNewActivityPlatforms(
    dashboardLastRefreshedAt: string,
    leafSegmentIds: string[],
  ): Promise<string[]> {
    let result: IPlatforms
    try {
      result = await this.connection.oneOrNone(
        `
      select 
        array_agg(distinct a.platform) as platforms 
      from mv_activities_cube a
      where a."segmentId" in ($(leafSegmentIds:csv))
        and a."createdAt" > $(dashboardLastRefreshedAt)
      `,
        {
          leafSegmentIds,
          dashboardLastRefreshedAt,
        },
      )
    } catch (err) {
      this.log.error('Error while getting all tenants', err)

      throw new Error(err)
    }

    return result.platforms
  }
}

export default ActivityRepository
