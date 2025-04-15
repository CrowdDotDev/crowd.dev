import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'

export default class GithubReposRepository extends RepositoryBase<GithubReposRepository> {
  private readonly cache: RedisCache

  constructor(dbStore: DbStore, redis: RedisClient, parentLog: Logger) {
    super(dbStore, parentLog)

    this.cache = new RedisCache('gitlabRepos', redis, this.log)
  }

  public async findSegmentForRepo(url: string): Promise<string | null> {
    const cached = await this.cache.get(url)
    if (cached) {
      if (cached === 'null') {
        return null
      }

      return cached
    }

    const results = await this.db().oneOrNone(
      `
        SELECT "segmentId"
        FROM "gitlabRepos"
        WHERE url = $(url) and "deletedAt" is null
        LIMIT 1
      `,
      {
        url,
      },
    )
    if (!results) {
      await this.cache.set(url, 'null', 7 * 60 * 60 * 24) // 7 days
      return null
    }

    await this.cache.set(url, results.segmentId, 7 * 60 * 60 * 24) // 7 days
    return results.segmentId
  }
}
