import { DbConnOrTx, DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { IFindActivitiesWithWrongMembersResult } from './types'

export class ActivityRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
    private readonly questdbSQL: DbConnOrTx,
  ) {}

  async getActivitiesWithWrongMembers(
    limit = 100,
    excludeMemberIds?: string[],
  ): Promise<IFindActivitiesWithWrongMembersResult[]> {
    try {
      const query = `
        SELECT DISTINCT a."memberId", a.username, a.platform
        FROM activities a
        LEFT JOIN "memberIdentities" mi ON a."memberId" = mi."memberId"
        WHERE mi."memberId" IS NULL
        ${excludeMemberIds?.length ? 'AND a."memberId" NOT IN ($(excludeMemberIds:csv))' : ''}
        LIMIT $(limit)
      `

      return await this.connection.query(query, {
        limit,
        excludeMemberIds,
      })
    } catch (err) {
      this.log.error('Error while finding activities!', err)
      throw new Error(err)
    }
  }

  async updateActivitiesWithWrongMember(
    wrongMemberId: string,
    correctMemberId: string,
  ): Promise<void> {
    try {
      this.log.info(`Updating activities from ${wrongMemberId} to ${correctMemberId}`)

      await this.connection.none(
        'UPDATE activities SET "memberId" = $(correctMemberId) WHERE "memberId" = $(wrongMemberId)',
        {
          wrongMemberId,
          correctMemberId,
        },
      )

      await this.questdbSQL.none(
        'UPDATE activities SET "memberId" = $(correctMemberId) WHERE "memberId" = $(wrongMemberId)',
        {
          wrongMemberId,
          correctMemberId,
        },
      )
    } catch (err) {
      this.log.error('Error while batch updating activities!', err)
      throw new Error(err)
    }
  }
}
