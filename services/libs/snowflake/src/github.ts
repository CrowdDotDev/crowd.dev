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
    perPage = 100,
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

  public async getRepoStargazers({
    repo,
    page = 1,
    perPage = 100,
    since_days_ago = '',
  }: {
    repo: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoStargazersResult>> {
    const fixedRepo = fixGitHubUrl(repo)
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
      WHERE repo_name = ?
      AND type = 'WatchEvent'
      ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      since_days_ago
        ? [fixedRepo, since_days_ago, perPage, (page - 1) * perPage]
        : [fixedRepo, perPage, (page - 1) * perPage],
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
    since_days_ago = '',
  }: {
    repo: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoForksResult>> {
    const fixedRepo = fixGitHubUrl(repo)
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
      WHERE repo_name = ?
      AND type = 'ForkEvent'
      ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      since_days_ago
        ? [fixedRepo, since_days_ago, perPage, (page - 1) * perPage]
        : [fixedRepo, perPage, (page - 1) * perPage],
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
    repo,
    page = 1,
    perPage = 100,
    since_days_ago = '',
  }: {
    repo: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoPullRequestsResult>> {
    const fixedRepo = fixGitHubUrl(repo)
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
      WHERE repo_name = ?
      AND type = 'PullRequestEvent'
      ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      since_days_ago
        ? [fixedRepo, since_days_ago, perPage, (page - 1) * perPage]
        : [fixedRepo, perPage, (page - 1) * perPage],
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
    repo,
    page = 1,
    perPage = 100,
    since_days_ago = undefined,
  }: {
    repo: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoPullRequestReviewsResult>> {
    const fixedRepo = fixGitHubUrl(repo)
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
      WHERE repo_name = ?
      AND type = 'PullRequestReviewEvent'
      ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      since_days_ago
        ? [fixedRepo, since_days_ago, perPage, (page - 1) * perPage]
        : [fixedRepo, perPage, (page - 1) * perPage],
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
    repo,
    page = 1,
    perPage = 100,
    since_days_ago = '',
  }: {
    repo: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoPullRequestReviewCommentsResult>> {
    const fixedRepo = fixGitHubUrl(repo)
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
      WHERE repo_name = ?
      AND type = 'PullRequestReviewCommentEvent'
      ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      since_days_ago
        ? [fixedRepo, since_days_ago, perPage, (page - 1) * perPage]
        : [fixedRepo, perPage, (page - 1) * perPage],
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
    since_days_ago = '',
  }: {
    repo: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoPushesResult>> {
    const fixedRepo = fixGitHubUrl(repo)
    const result = await this.client.run<IGetRepoPushesResult>(
      `SELECT
        CREATED_AT_TIMESTAMP as "timestamp",
        ACTOR_LOGIN as "actorLogin",
        ACTOR_ID as "actorId",
        ACTOR_AVATAR_URL as "actorAvatarUrl",
        ORG_LOGIN as "orgLogin",
        ORG_ID as "orgId",
        ORG_AVATAR_URL as "orgAvatarUrl",
        ARRAY_SIZE(PAYLOAD:commits) as "commitCount",
        PAYLOAD as "payload"
      FROM github_events_ingest.cybersyn.github_events
      WHERE repo_name = ?
      AND type = 'PushEvent'
      ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      since_days_ago
        ? [fixedRepo, since_days_ago, perPage, (page - 1) * perPage]
        : [fixedRepo, perPage, (page - 1) * perPage],
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
    since_days_ago = '',
  }: {
    repo: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoIssuesResult>> {
    const fixedRepo = fixGitHubUrl(repo)
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
      WHERE repo_name = ?
      AND type = 'IssuesEvent'
      ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      since_days_ago
        ? [fixedRepo, since_days_ago, perPage, (page - 1) * perPage]
        : [fixedRepo, perPage, (page - 1) * perPage],
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
    since_days_ago = '',
  }: {
    repo: string
    page?: number
    perPage?: number
    since_days_ago?: string
  }): Promise<IGetResponse<IGetRepoIssueCommentsResult>> {
    const fixedRepo = fixGitHubUrl(repo)
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
      WHERE repo_name = ?
      AND type = 'IssueCommentEvent'
      ${since_days_ago ? 'AND CREATED_AT_TIMESTAMP >= DATEADD(day, -?, CURRENT_TIMESTAMP())' : ''}
      ORDER BY CREATED_AT_TIMESTAMP DESC
      LIMIT ?
      OFFSET ?`,
      since_days_ago
        ? [fixedRepo, since_days_ago, perPage, (page - 1) * perPage]
        : [fixedRepo, perPage, (page - 1) * perPage],
    )

    return {
      data: result,
      hasNextPage: result.length === perPage,
      nextPage: page + 1,
      perPage,
    }
  }
}
