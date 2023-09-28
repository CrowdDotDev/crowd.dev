import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'

export default class GithubReposRepository extends RepositoryBase<GithubReposRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async findSegmentForRepo(tenantId: string, url: string): Promise<string | null> {
    const results = await this.db().one(
      `
        SELECT "segmentId"
        FROM "githubRepos"
        WHERE "tenantId" = $(tenantId) AND url = $(url)
        LIMIT 1
      `,
      {
        tenantId,
        url,
      },
    )
    if (!results) {
      return null
    }
    return results.segmentId
  }
}
