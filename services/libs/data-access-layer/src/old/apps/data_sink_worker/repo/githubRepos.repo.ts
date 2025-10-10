import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'

export default class GithubReposRepository extends RepositoryBase<GithubReposRepository> {
  private readonly cache: RedisCache
  constructor(dbStore: DbStore, redis: RedisClient, parentLog: Logger) {
    super(dbStore, parentLog)

    this.cache = new RedisCache('githubRepos', redis, this.log)
  }

  public async findSegmentForRepo(integrationId: string, url: string): Promise<string | null> {
    const results = await this.findSegmentsForRepos([{ integrationId, url }])

    if (results.length === 1) {
      return results[0].segmentId
    }

    return null
  }

  public async findSegmentsForRepos(
    toFind: { integrationId: string; url: string }[],
  ): Promise<{ integrationId: string; url: string; segmentId: string | undefined }[]> {
    const results: { integrationId: string; url: string; segmentId: string | undefined }[] = []

    let promises = []
    for (const repo of toFind) {
      promises.push(
        (async () => {
          const key = `${repo.integrationId}:${repo.url}`
          const cached = await this.cache.get(key)
          if (cached) {
            if (cached === 'null') {
              results.push({
                integrationId: repo.integrationId,
                url: repo.url,
                segmentId: undefined,
              })
            } else {
              results.push({ integrationId: repo.integrationId, url: repo.url, segmentId: cached })
            }
          }
        })().catch((err) => this.log.error(err, 'Error finding segment for github repo in redis!')),
      )
    }

    await Promise.all(promises)

    const remainingRepos = toFind.filter(
      (r) =>
        results.find((e) => e.integrationId === r.integrationId && e.url === r.url) === undefined,
    )

    if (remainingRepos.length > 0) {
      const orConditions: string[] = []
      const params: Record<string, string> = {}

      let index = 0
      for (const repo of remainingRepos) {
        const repoKey = `repo_${index++}`
        const integrationKey = `integration_${index++}`

        orConditions.push(`(url = $(${repoKey}) and "integrationId" = $(${integrationKey}))`)
        params[repoKey] = repo.url
        params[integrationKey] = repo.integrationId
      }

      const dbResults = await this.db().any(
        `
          SELECT "integrationId", "url", "segmentId"
          FROM "githubRepos"
          WHERE "deletedAt" is null and (${orConditions.join(' or ')})
          LIMIT ${remainingRepos.length}
        `,
        params,
      )

      promises = []
      for (const repo of remainingRepos) {
        const key = `${repo.integrationId}:${repo.url}`

        const found = dbResults.find(
          (e) => e.integrationId === repo.integrationId && e.url === repo.url,
        )

        if (found) {
          results.push({
            integrationId: repo.integrationId,
            url: repo.url,
            segmentId: found.segmentId,
          })
          promises.push(this.cache.set(key, found.segmentId, 7 * 60 * 60 * 24))
        } else {
          promises.push(this.cache.set(key, 'null', 7 * 60 * 60 * 24))
          results.push({
            integrationId: repo.integrationId,
            url: repo.url,
            segmentId: undefined,
          })
        }
      }
    }

    await Promise.all(promises)

    return results
  }
}
