import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { getNewActivityPlatforms } from '../../../activities'

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
