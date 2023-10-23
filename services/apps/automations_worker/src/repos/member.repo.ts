import { Logger } from '@crowd/logging'
import { DbStore, RepositoryBase } from '@crowd/database'

export interface IMemberData {
  id: string
  tenantId: string
  username: string
}

export class MemberRepository extends RepositoryBase<MemberRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  async get(memberId: string): Promise<IMemberData | null> {
    const results = await this.db().oneOrNone(
      `
    select id, "tenantId", username
    from members
    where id = $(memberId)
    `,
      {
        memberId,
      },
    )

    return results
  }
}
