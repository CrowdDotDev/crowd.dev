import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IActivityCreateData } from '@crowd/types'

export class ActivityRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
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
    } catch (err) {
      this.log.error('Error while updating activities!', err)
      throw new Error(err)
    }
  }
}
