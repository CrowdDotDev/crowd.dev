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

  async getActivitiesWithWrongMembers(limit = 100): Promise<IActivityWithWrongMember[]> {
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
        WHERE a."memberId" <> mi."memberId"
        GROUP BY a.username, a.platform
        ORDER BY COUNT(*) DESC
        LIMIT $(limit)
        `,
        {
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
  ): Promise<void> {
    try {
      await this.connection.none(
        `
        UPDATE activities
        SET "memberId" = $(correctMemberId)
        WHERE "username" = $(username)
        AND platform = $(platform)
        `,
        {
          username,
          platform,
          correctMemberId,
        },
      )
    } catch (err) {
      this.log.error('Error while updating activities!', err)
      throw new Error(err)
    }
  }
}
