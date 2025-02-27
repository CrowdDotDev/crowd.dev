import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { IDbMemberId } from './member.data'

export class MemberRepository extends RepositoryBase<MemberRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async checkMembersExist(ids: string[]): Promise<IDbMemberId[]> {
    const results = await this.db().any(
      `
        select id from members m
        where m."id" in ($(ids:csv)) and m."deletedAt" is null
      `,
      {
        ids,
      },
    )

    return results
  }
}
