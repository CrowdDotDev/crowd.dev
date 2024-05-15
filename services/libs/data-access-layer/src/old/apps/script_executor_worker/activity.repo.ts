import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IActivityPartial } from './types'

class ActivityRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
  ) {}

  /**
   * Activities have identity references in the activity table.
   * This function finds activities with different memberIds in referenced identity and activity.memberId
   * @param tenantId
   * @param limit
   * @returns
   */
  async findActivitiesWithWrongMemberId(
    tenantId: string,
    limit = 5000,
  ): Promise<IActivityPartial[]> {
    let rows: IActivityPartial[] = []
    try {
      rows = await this.connection.query(
        `
        select 
          a.id, 
          a."memberId" as "wrongMemberId", 
          mi."memberId" as "correctMemberId", 
          a.username 
        from activities a
          join "memberIdentities" mi on mi.platform = a.platform and
                                        mi.value = a.username and
                                        mi."tenantId" = a."tenantId" and
                                        mi.verified
          where a."memberId" <> mi."memberId"
          and a."tenantId" = $(tenantId)
          order by a.id desc
          limit $(limit);
      `,
        {
          tenantId,
          limit,
        },
      )
    } catch (err) {
      this.log.error('Error while finding activties with wrong member id!', err)

      throw new Error(err)
    }

    return rows
  }

  async updateActivityMember(id: string, memberId: string): Promise<void> {
    try {
      await this.connection.any(
        `
          update activities set "memberId" = $(memberId) where "id" = $(id);
        `,
        {
          id,
          memberId,
        },
      )
    } catch (err) {
      throw new Error(err)
    }
  }
}

export default ActivityRepository
