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

const fixGitHubUrl = (url: string) => {
  return url.replace('https://github.com/', '')
}

export class GithubSnowflakeClient {
  constructor(private client: SnowflakeClient) {}

  public async getOrgRepositories({
    org,
    perPage = 1000,
    page = 1,
  }: {
    org: string
    perPage?: number
    page?: number
  }): Promise<IGetOrgRepositoriesResult> {
    const result = await this.client.run<{ id: number; name: string }>(
      `SELECT repo_id as "sfId", repo_name as "name"
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

  public async getRepoId({ repo }: { repo: string }): Promise<string> {
    const result = await this.client.run<{ id: string }>(
      `SELECT repo_id as "id" FROM github_events_ingest.cybersyn.github_repos WHERE repo_name = ? limit 1`,
      [fixGitHubUrl(repo)],
    )
    return result[0].id
  }

  public async getRepoStargazers({
    sf_repo_id,
    page = 1,
    perPage = 1000,
    since_days_ago = '',
  }: {
    sf_repo_id: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoStargazersResult>> {
    const result = await this.client.run<IGetRepoStargazersResult>(
      `SELECT
        ID as "sfId",
        PAYLOAD:action as "action",
        CREATED_AT_TIMESTAMP as "timestamp",
        ACTOR_LOGIN as "actorLogin",
        ACTOR_ID as "actorId",
        ACTOR_AVATAR_URL as "actorAvatarUrl",
        ORG_LOGIN as "orgLogin",
        ORG_ID as "orgId",
        ORG_AVATAR_URL as "orgAvatarUrl",
        PAYLOAD as "payload"
      FROM github_events_ingest.cybersyn.github_events
      WHERE repo_id = ?
      AND type = 'WatchEvent'
      ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      since_days_ago
        ? [sf_repo_id, since_days_ago, perPage, (page - 1) * perPage]
        : [sf_repo_id, perPage, (page - 1) * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }

  public async getRepoForks({
    sf_repo_id,
    page = 1,
    perPage = 1000,
    since_days_ago = '',
  }: {
    sf_repo_id: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoForksResult>> {
    const result = await this.client.run<IGetRepoForksResult>(
      `SELECT
        ID as "sfId",
        PAYLOAD:forkee.full_name as "fork",
        PAYLOAD:forkee.id as "forkId",
        CREATED_AT_TIMESTAMP as "timestamp",
        ACTOR_LOGIN as "actorLogin",
        ACTOR_ID as "actorId",
        ACTOR_AVATAR_URL as "actorAvatarUrl",
        ORG_LOGIN as "orgLogin",
        ORG_ID as "orgId",
        ORG_AVATAR_URL as "orgAvatarUrl",
        PAYLOAD as "payload"
      FROM github_events_ingest.cybersyn.github_events
      WHERE repo_id = ?
      AND type = 'ForkEvent'
      ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      since_days_ago
        ? [sf_repo_id, since_days_ago, perPage, (page - 1) * perPage]
        : [sf_repo_id, perPage, (page - 1) * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }

  // this is for pull requests open / closed
  public async getRepoPullRequests({
    sf_repo_id,
    page = 1,
    perPage = 1000,
    since_days_ago = '',
  }: {
    sf_repo_id: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoPullRequestsResult>> {
    const result = await this.client.run<IGetRepoPullRequestsResult>(
      `SELECT
        ID as "sfId",
        PAYLOAD:action as "action",
        PAYLOAD:number as "pullRequestNumber",
        CREATED_AT_TIMESTAMP as "timestamp",
        ACTOR_LOGIN as "actorLogin",
        ACTOR_ID as "actorId",
        ACTOR_AVATAR_URL as "actorAvatarUrl",
        ORG_LOGIN as "orgLogin",
        ORG_ID as "orgId",
        ORG_AVATAR_URL as "orgAvatarUrl",
        PAYLOAD as "payload"
      FROM github_events_ingest.cybersyn.github_events
      WHERE repo_id = ?
      AND type = 'PullRequestEvent'
      ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      since_days_ago
        ? [sf_repo_id, since_days_ago, perPage, (page - 1) * perPage]
        : [sf_repo_id, perPage, (page - 1) * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }

  // this is for reviews on pull requests - should be here stuff like assigned, unassigned, review requested, review dismissed, etc.
  public async getRepoPullRequestReviews({
    sf_repo_id,
    page = 1,
    perPage = 1000,
    since_days_ago = undefined,
  }: {
    sf_repo_id: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoPullRequestReviewsResult>> {
    const result = await this.client.run<IGetRepoPullRequestReviewsResult>(
      `SELECT
        ID as "sfId",
        PAYLOAD:review.state as "state",
        PAYLOAD:pull_request.number as "pullRequestNumber",
        CREATED_AT_TIMESTAMP as "timestamp",
        ACTOR_LOGIN as "actorLogin",
        ACTOR_ID as "actorId",
        ACTOR_AVATAR_URL as "actorAvatarUrl",
        ORG_LOGIN as "orgLogin",
        ORG_ID as "orgId",
        ORG_AVATAR_URL as "orgAvatarUrl",
        PAYLOAD as "payload"
      FROM github_events_ingest.cybersyn.github_events
      WHERE repo_id = ?
      AND type = 'PullRequestReviewEvent'
      ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      since_days_ago
        ? [sf_repo_id, since_days_ago, perPage, (page - 1) * perPage]
        : [sf_repo_id, perPage, (page - 1) * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }

  // this is basically only for comments on pull requests
  public async getRepoPullRequestReviewComments({
    sf_repo_id,
    page = 1,
    perPage = 1000,
    since_days_ago = '',
  }: {
    sf_repo_id: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoPullRequestReviewCommentsResult>> {
    const result = await this.client.run<IGetRepoPullRequestReviewCommentsResult>(
      `SELECT
        ID as "sfId",
        PAYLOAD:action as "action",
        PAYLOAD:pull_request.number as "pullRequestNumber",
        CREATED_AT_TIMESTAMP as "timestamp",
        ACTOR_LOGIN as "actorLogin",
        ACTOR_ID as "actorId",
        ACTOR_AVATAR_URL as "actorAvatarUrl",
        ORG_LOGIN as "orgLogin",
        ORG_ID as "orgId",
        ORG_AVATAR_URL as "orgAvatarUrl",
        PAYLOAD as "payload"
      FROM github_events_ingest.cybersyn.github_events
      WHERE repo_id = ?
      AND type = 'PullRequestReviewCommentEvent'
      ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      since_days_ago
        ? [sf_repo_id, since_days_ago, perPage, (page - 1) * perPage]
        : [sf_repo_id, perPage, (page - 1) * perPage],
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
    sf_repo_id,
    page = 1,
    perPage = 1000,
    since_days_ago = '',
  }: {
    sf_repo_id: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoPushesResult>> {
    const result = await this.client.run<IGetRepoPushesResult>(
      `
        SELECT
            p.CREATED_AT_TIMESTAMP as "timestamp",
            p.ACTOR_LOGIN as "actorLogin",
            p.ACTOR_ID as "actorId",
            p.ACTOR_AVATAR_URL as "actorAvatarUrl",
            p.ORG_LOGIN as "orgLogin",
            p.ORG_ID as "orgId",
            p.ORG_AVATAR_URL as "orgAvatarUrl",
            p.PAYLOAD as "payload",
            p.PAYLOAD_HEAD as "payloadHead"
        FROM github_events_ingest.cybersyn.github_events p
        WHERE repo_id = ?
        AND type = 'PushEvent'
        AND payload_ref IN ('refs/heads/master', 'refs/heads/main')
        ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
        ORDER BY CREATED_AT_TIMESTAMP DESC
        LIMIT ?
        OFFSET ?
      `,
      since_days_ago
        ? [sf_repo_id, since_days_ago, perPage, (page - 1) * perPage]
        : [sf_repo_id, perPage, (page - 1) * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }

  public async getRepoIssues({
    sf_repo_id,
    page = 1,
    perPage = 1000,
    since_days_ago = '',
  }: {
    sf_repo_id: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoIssuesResult>> {
    const result = await this.client.run<IGetRepoIssuesResult>(
      `SELECT
        ID as "sfId",
        PAYLOAD:action as "action",
        PAYLOAD:issue.number as "issueNumber",
        CREATED_AT_TIMESTAMP as "timestamp",
        ACTOR_LOGIN as "actorLogin",
        ACTOR_ID as "actorId",
        ACTOR_AVATAR_URL as "actorAvatarUrl",
        ORG_LOGIN as "orgLogin",
        ORG_ID as "orgId",
        ORG_AVATAR_URL as "orgAvatarUrl",
        PAYLOAD as "payload"
      FROM github_events_ingest.cybersyn.github_events
      WHERE repo_id = ?
      AND type = 'IssuesEvent'
      ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      since_days_ago
        ? [sf_repo_id, since_days_ago, perPage, (page - 1) * perPage]
        : [sf_repo_id, perPage, (page - 1) * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }

  public async getRepoIssueComments({
    sf_repo_id,
    page = 1,
    perPage = 1000,
    since_days_ago = '',
  }: {
    sf_repo_id: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoIssueCommentsResult>> {
    const result = await this.client.run<IGetRepoIssueCommentsResult>(
      `SELECT
        ID as "sfId",
        PAYLOAD:action as "action",
        PAYLOAD:issue.number as "issueNumber",
        CREATED_AT_TIMESTAMP as "timestamp",
        ACTOR_LOGIN as "actorLogin",
        ACTOR_ID as "actorId",
        ACTOR_AVATAR_URL as "actorAvatarUrl",
        ORG_LOGIN as "orgLogin",
        ORG_ID as "orgId",
        ORG_AVATAR_URL as "orgAvatarUrl",
        PAYLOAD as "payload"
      FROM github_events_ingest.cybersyn.github_events
      WHERE repo_id = ?
      AND type = 'IssueCommentEvent'
      ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      since_days_ago
        ? [sf_repo_id, since_days_ago, perPage, (page - 1) * perPage]
        : [sf_repo_id, perPage, (page - 1) * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }
}
