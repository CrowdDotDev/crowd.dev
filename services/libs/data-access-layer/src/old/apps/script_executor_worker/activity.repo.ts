import { DbConnOrTx, DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { IDbActivity } from '../data_sink_worker/repo/activity.data'

class ActivityRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
    private readonly questdbSQL: DbConnOrTx,
  ) {}

  async findActivitiesPg(
    memberId: string,
    organizationId: string,
    { limit = 100, offset = 0 },
  ): Promise<IDbActivity[]> {
    return this.connection.query(
      `select * from activities where "memberId" = $(memberId) and "organizationId" = $(organizationId) limit $(limit) offset $(offset)`,
      {
        memberId,
        organizationId,
        limit,
        offset,
      },
    )
  }

  // async findActivitiesQuestDb(memberId: string, organizationId: string): Promise<number> {
  //   const results = await this.questdbSQL.query(
  //     `select count(*) as count from activities where "memberId" = $(memberId) and "organizationId" = $(organizationId)`,
  //     {
  //       memberId,
  //       organizationId,
  //     },
  //   )

  //   return Number(results[0].count)
  // }

  async hasActivity(memberId: string, organizationId: string): Promise<boolean> {
    const results = await this.questdbSQL.query(
      `select 1 from activities where "memberId" = $(memberId) and "organizationId" = $(organizationId) limit 1`,
      {
        memberId,
        organizationId,
      },
    )

    return results.length > 0
  }
}

export default ActivityRepository
