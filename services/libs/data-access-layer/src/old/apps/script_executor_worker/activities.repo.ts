import { DbConnOrTx, DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IActivityCreateData } from '@crowd/types'

import { updateActivities } from '../../../activities/update'

export class ActivityRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
    private readonly questdbSQL: DbConnOrTx,
  ) {}

  async getActivitiesWithWrongMembers(
    tenantId: string,
    limit = 100,
  ): Promise<IActivityCreateData[]> {
    try {
      return await this.connection.query(
        `
        SELECT 
          a.id,
          a.username,
          a.platform
        FROM activities a
        JOIN "memberIdentities" mi ON a.username = mi.value
          AND a.platform = mi.platform 
          AND mi.type = 'username'
          AND mi."verified" = true
          AND a."tenantId" = mi."tenantId"
        WHERE a."memberId" <> mi."memberId"
          AND a."tenantId" = $(tenantId)
        LIMIT $(limit)
        `,
        {
          tenantId,
          limit,
        },
      )
    } catch (err) {
      this.log.error('Error while finding activities!', err)
      throw new Error(err)
    }
  }

  async updateActivityWithWrongMember(activityId: string, correctMemberId: string): Promise<void> {
    try {
      // Update the activity in pgsql to persist progress
      await this.connection.none(
        `
        UPDATE activities
        SET "memberId" = $(correctMemberId)
        WHERE id = $(activityId)
        `,
        {
          correctMemberId,
          activityId,
        },
      )

      // Update the activity in QuestDB
      await updateActivities(
        this.questdbSQL,
        async () => ({ memberId: correctMemberId }),
        'id = $(activityId)',
        {
          activityId,
        },
      )
    } catch (err) {
      this.log.error('Error while updating activities!', err)
      throw new Error(err)
    }
  }
}
