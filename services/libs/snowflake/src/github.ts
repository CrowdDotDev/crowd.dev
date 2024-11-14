import { type SnowflakeClient } from './client'
import {
  type IGetOrgRepositoriesResult,
  type IGetRepoForksResult,
  type IGetRepoIssueCommentsResult,
  type IGetRepoIssuesResult,
  type IGetRepoPullRequestReviewCommentsResult,
  type IGetRepoPullRequestReviewsResult,
  type IGetRepoPullRequestsResult,
  type IGetRepoPushesResult,
  type IGetRepoStargazersResult,
  type IGetResponse,
} from './types'

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
      WHERE REGEXP_LIKE(repo_name, ?)
      LIMIT ?
      OFFSET ?`,
      [`^${org}/[^/]+$`, perPage, (page - 1) * perPage],
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
      [repo, perPage, (page - 1) * perPage],
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
      [repo, perPage, (page - 1) * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }

  public async getRepoPullRequests({
    repo,
    page = 1,
    perPage = 100,
  }: {
    repo: string
    page?: number
    perPage?: number
  }): Promise<IGetResponse<IGetRepoPullRequestsResult>> {
    const result = await this.client.run<IGetRepoPullRequestsResult>(
      `SELECT 
        ID as id,
        PAYLOAD:action as action,
        PAYLOAD:number as pullRequestNumber,
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
      AND type = 'PullRequestEvent'
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      [repo, perPage, (page - 1) * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }

  public async getRepoPullRequestReviews({
    repo,
    page = 1,
    perPage = 100,
  }: {
    repo: string
    page?: number
    perPage?: number
  }): Promise<IGetResponse<IGetRepoPullRequestReviewsResult>> {
    const result = await this.client.run<IGetRepoPullRequestReviewsResult>(
      `SELECT 
        ID as id,
        PAYLOAD:review.state as state,
        PAYLOAD:pull_request.number as pullRequestNumber,
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
      AND type = 'PullRequestReviewEvent'
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      [repo, perPage, (page - 1) * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }

  public async getRepoPullRequestReviewComments({
    repo,
    page = 1,
    perPage = 100,
  }: {
    repo: string
    page?: number
    perPage?: number
  }): Promise<IGetResponse<IGetRepoPullRequestReviewCommentsResult>> {
    const result = await this.client.run<IGetRepoPullRequestReviewCommentsResult>(
      `SELECT 
        ID as id,
        PAYLOAD:action as action,
        PAYLOAD:pull_request.number as pullRequestNumber,
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
      AND type = 'PullRequestReviewCommentEvent'
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      [repo, perPage, (page - 1) * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }

  // this is commits
  public async getRepoPushes({
    repo,
    page = 1,
    perPage = 100,
  }: {
    repo: string
    page?: number
    perPage?: number
  }): Promise<IGetResponse<IGetRepoPushesResult>> {
    const result = await this.client.run<IGetRepoPushesResult>(
      `SELECT 
        CREATED_AT_TIMESTAMP as timestamp,
        ACTOR_LOGIN as actorLogin,
        ACTOR_ID as actorId,
        ACTOR_AVATAR_URL as actorAvatarUrl,
        ORG_LOGIN as orgLogin,
        ORG_ID as orgId,
        ORG_AVATAR_URL as orgAvatarUrl,
        ARRAY_SIZE(PAYLOAD:commits) as commitCount,
        PAYLOAD as payload
      FROM GITHUB_EVENTS
      WHERE repo_name = ?
      AND type = 'PushEvent'
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      [repo, perPage, (page - 1) * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }

  public async getRepoIssues({
    repo,
    page = 1,
    perPage = 100,
  }: {
    repo: string
    page?: number
    perPage?: number
  }): Promise<IGetResponse<IGetRepoIssuesResult>> {
    const result = await this.client.run<IGetRepoIssuesResult>(
      `SELECT 
        ID as id,
        PAYLOAD:action as action,
        PAYLOAD:issue.number as issueNumber,
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
      AND type = 'IssuesEvent'
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      [repo, perPage, (page - 1) * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }

  public async getRepoIssueComments({
    repo,
    page = 1,
    perPage = 100,
  }: {
    repo: string
    page?: number
    perPage?: number
  }): Promise<IGetResponse<IGetRepoIssueCommentsResult>> {
    const result = await this.client.run<IGetRepoIssueCommentsResult>(
      `SELECT 
        ID as id,
        PAYLOAD:action as action,
        PAYLOAD:issue.number as issueNumber,
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
      AND type = 'IssueCommentEvent'
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      [repo, perPage, (page - 1) * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }
}
