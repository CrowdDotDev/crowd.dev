import { Logger } from '@crowd/logging'
import { DbStore, RepositoryBase } from '@crowd/database'

export interface IActivityData {
  id: string
  type: string
  platform: string
  body: string
  isTeamMember: boolean
  isBot: boolean
  tenantId: string
}

export class ActivityRepository extends RepositoryBase<ActivityRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  async get(activityId: string): Promise<IActivityData | null> {
    const results = await this.db().oneOrNone(
      `
    select  a.id, 
            a.type, 
            a.platform, 
            a.body, 
            a."tenantId", 
            coalesce(m.attributes->'isTeamMember'->>'default', 'false')::boolean as "isTeamMember",
            coalesce(m.attributes->'isBot'->>'default', 'false')::boolean as "isBot"
    from activities a
    inner join members m on m.id = a."memberId"
    where a.id = $(activityId)
    `,
      {
        activityId,
      },
    )

    return results
  }
}
