import { DbConnOrTx, DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { IDbActivity } from '../data_sink_worker/repo/activity.data'

class ActivityRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
    private readonly questdbSQL: DbConnOrTx,
  ) {}

  findActivities(memberId: string, organizationId: string): Promise<IDbActivity[]> {
    return this.connection.query(
      `select * from activities where "memberId" = $(memberId) and "organizationId" = $(organizationId)`,
      {
        memberId,
        organizationId,
      },
    )
  }
}

export default ActivityRepository
