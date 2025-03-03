import { DbConnOrTx, DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { IDbActivity } from '../data_sink_worker/repo/activity.data'

class ActivityRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
    private readonly questdbSQL: DbConnOrTx,
  ) {}

  async findActivitiesPg(memberId: string, organizationId: string): Promise<IDbActivity[]> {
    return this.connection.query(
      `select * from activities where "memberId" = $(memberId) and "organizationId" = $(organizationId)`,
      {
        memberId,
        organizationId,
      },
    )
  }

  async findActivitiesQuestDb(memberId: string, organizationId: string): Promise<number> {
    const result = await this.questdbSQL.query(
      `select count(*) from activities where "memberId" = $(memberId) and "organizationId" = $(organizationId)`,
      {
        memberId,
        organizationId,
      },
    )

    return result.count
  }
}

export default ActivityRepository
