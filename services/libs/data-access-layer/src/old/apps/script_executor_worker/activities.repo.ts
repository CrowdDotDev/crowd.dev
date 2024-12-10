import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'

export interface IActivityWithWrongMember {
  username: string
  platform: string
  activityCount: number
}

export class ActivityRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
  ) {}

  async getActivitiesWithWrongMembers(
    tenantId: string,
    limit = 100,
  ): Promise<IActivityWithWrongMember[]> {
    try {
      return await this.connection.query(
        `
        SELECT 
          a.username,
          a.platform,
          COUNT(*) as "activityCount"
        FROM activities a
        JOIN "memberIdentities" mi ON a.username = mi.value
          AND a.platform = mi.platform 
          AND mi.type = 'username'
          AND mi."verified" = true
          AND a."tenantId" = mi."tenantId"
        WHERE a."memberId" <> mi."memberId"
          AND a."tenantId" = $(tenantId)
        GROUP BY a.username, a.platform
        ORDER BY COUNT(*) DESC
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

  async updateActivities(
    username: string,
    platform: string,
    correctMemberId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      await this.connection.none(
        `
        UPDATE activities
        SET "memberId" = $(correctMemberId)
        WHERE "username" = $(username)
        AND platform = $(platform)
        AND "memberId" != $(correctMemberId)
        AND "tenantId" = $(tenantId)
        `,
        {
          username,
          platform,
          correctMemberId,
          tenantId,
        },
      )
    } catch (err) {
      this.log.error('Error while updating activities!', err)
      throw new Error(err)
    }
  }
}
