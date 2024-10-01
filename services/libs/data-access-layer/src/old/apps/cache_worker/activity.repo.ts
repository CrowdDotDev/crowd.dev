import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IPlatforms } from './types'
import { getNewActivityPlatforms } from '../../../activities'

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
      result = await getNewActivityPlatforms(this.connection, {
        segmentIds: leafSegmentIds,
        after: new Date(Date.parse(dashboardLastRefreshedAt)),
      })
    } catch (err) {
      this.log.error('Error while getting all tenants', err)

      throw new Error(err)
    }

    return result.platforms
  }
}

export default ActivityRepository
