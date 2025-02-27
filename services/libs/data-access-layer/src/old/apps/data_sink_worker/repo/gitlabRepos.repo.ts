import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'

export default class GithubReposRepository extends RepositoryBase<GithubReposRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async findSegmentForRepo(url: string): Promise<string | null> {
    const results = await this.db().oneOrNone(
      `
        SELECT "segmentId"
        FROM "gitlabRepos"
        WHERE url = $(url)
        LIMIT 1
      `,
      {
        url,
      },
    )
    if (!results) {
      return null
    }
    return results.segmentId
  }
}
