import { type SnowflakeClient } from './client'

interface IGetOrgRepositoriesResult {
  id: number
  name: string
}

export class GithubSnowflakeClient {
  constructor(private client: SnowflakeClient) {}

  public async getOrgRepositories({
    org,
    perPage = 100,
    page = 1,
  }: {
    org: string
    perPage?: number
    page?: number
  }) {
    const result = await this.client.run<IGetOrgRepositoriesResult>(
      `SELECT repo_id as id, repo_name as name 
      FROM github_events_ingest.cybersyn.github_repos 
      WHERE startswith(repo_name, ?)
      LIMIT ?
      OFFSET ?`,
      [`${org}/`, perPage, page * perPage],
    )

    return result
  }
}
