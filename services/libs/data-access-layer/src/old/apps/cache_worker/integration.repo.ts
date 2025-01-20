import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { IPlatforms } from './types'

class IntegrationRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
  ) {}

  async findActivePlatforms(leafSegmentIds: string[]): Promise<string[]> {
    let result: IPlatforms
    try {
      result = await this.connection.oneOrNone(
        `
      select 
        array_agg(distinct i.platform) as platforms 
      from integrations i
      where i."segmentId" in ($(leafSegmentIds:csv))
        and i."deletedAt" is null
        and i.status in ('done', 'in-progress');
      `,
        {
          leafSegmentIds,
        },
      )
    } catch (err) {
      this.log.error('Error while finding active platforms', err)

      throw new Error(err)
    }

    return result.platforms || []
  }
}

export default IntegrationRepository
