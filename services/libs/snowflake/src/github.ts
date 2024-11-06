import { type SnowflakeClient } from './client'

interface IGetOrgRepositoriesResult {
  data: {
    id: number
    name: string
  }[]
  hasNextPage: boolean
  nextPage: number
  perPage: number
}

export interface IBasicResponse {
  actorLogin: string
  actorId: number
  actorAvatarUrl: string
  orgLogin: string | null
  orgId: number | null
  orgAvatarUrl: string | null
}

interface IGetRepoStargazersResult extends IBasicResponse {
  id: number
  action: string
  timestamp: string
  payload: Record<string, unknown>
}

interface IGetRepoForksResult extends IBasicResponse {
  id: number
  fork: string
  forkId: number
  timestamp: string
  payload: Record<string, unknown>
}

export interface IGetResponse<T extends IBasicResponse = IBasicResponse> {
  data: T[]
  hasNextPage: boolean
  nextPage: number
  perPage: number
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
  }): Promise<IGetOrgRepositoriesResult> {
    const result = await this.client.run<{ id: number; name: string }>(
      `SELECT repo_id as id, repo_name as name 
      FROM github_events_ingest.cybersyn.github_repos 
      WHERE startswith(repo_name, ?)
      LIMIT ?
      OFFSET ?`,
      [`${org}/`, perPage, page * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }

  public async getRepoStargazers({
    repo,
    page = 1,
    perPage = 100,
  }: {
    repo: string
    page?: number
    perPage?: number
  }): Promise<IGetResponse<IGetRepoStargazersResult>> {
    const result = await this.client.run<IGetRepoStargazersResult>(
      `SELECT 
        ID as id,
        PAYLOAD:action as action,
        CREATED_AT_TIMESTAMP as timestamp,
        ACTOR_LOGIN as actorLogin,
        ACTOR_ID as actorId,
        ACTOR_AVATAR_URL as actorAvatarUrl,
        ORG_LOGIN as orgLogin,
        ORG_ID as orgId, 
        ORG_AVATAR_URL as orgAvatarUrl,
        PAYLOAD as payload
      FROM GITHUB_EVENTS
      WHERE repo_name = ?
      AND type = 'WatchEvent'
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      [repo, perPage, page * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }

  public async getRepoForks({
    repo,
    page = 1,
    perPage = 100,
  }: {
    repo: string
    page?: number
    perPage?: number
  }): Promise<IGetResponse<IGetRepoForksResult>> {
    const result = await this.client.run<IGetRepoForksResult>(
      `SELECT 
        ID as id,
        PAYLOAD:forkee.full_name as fork,
        PAYLOAD:forkee.id as forkId,
        CREATED_AT_TIMESTAMP as timestamp,
        ACTOR_LOGIN as actorLogin,
        ACTOR_ID as actorId,
        ACTOR_AVATAR_URL as actorAvatarUrl,
        ORG_LOGIN as orgLogin,
        ORG_ID as orgId,
        ORG_AVATAR_URL as orgAvatarUrl,
        PAYLOAD as payload
      FROM GITHUB_EVENTS
      WHERE repo_name = ?
      AND type = 'ForkEvent'
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      [repo, perPage, page * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }
}
