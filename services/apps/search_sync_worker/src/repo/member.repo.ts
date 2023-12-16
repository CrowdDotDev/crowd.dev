import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import { IDbMemberId } from './member.data'

export class MemberRepository extends RepositoryBase<MemberRepository> {
  private readonly cache: RedisCache

  constructor(redisClient: RedisClient, dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)

    this.cache = new RedisCache('memberAttributes', redisClient, this.log)
  }

  public async getTenantIds(): Promise<string[]> {
    const results = await this.db().any(`select distinct "tenantId" from members;`)

    return results.map((r) => r.tenantId)
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
