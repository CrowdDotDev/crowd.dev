import moment from 'moment/moment'
import { createAppAuth } from '@octokit/auth-app'
import verifyGithubWebhook from 'verify-github-webhook'
import {
  GITHUB_GRID,
  GITHUB_MEMBER_ATTRIBUTES,
  GithubActivityType,
  GithubPullRequestEvents,
  TWITTER_MEMBER_ATTRIBUTES,
} from '@crowd/integrations'
import {
  IActivityScoringGrid,
  IntegrationType,
  MemberAttributeName,
  PlatformType,
} from '@crowd/types'
import { RedisCache, getRedisClient } from '@crowd/redis'
import { timeout, singleOrDefault } from '@crowd/common'
import { Repo, Repos } from '../../types/regularTypes'
import {
  IIntegrationStream,
  IPendingStream,
  IProcessStreamResults,
  IProcessWebhookResults,
  IStepContext,
} from '../../../../types/integration/stepResult'
import MemberAttributeSettingsService from '../../../../services/memberAttributeSettingsService'
import { GITHUB_CONFIG, IS_TEST_ENV, REDIS_CONFIG } from '../../../../conf'
import StargazersQuery from '../../usecases/github/graphql/stargazers'
import { IntegrationServiceBase } from '../integrationServiceBase'
import PullRequestsQuery from '../../usecases/github/graphql/pullRequests'
import PullRequestCommentsQuery from '../../usecases/github/graphql/pullRequestComments'
import IssuesQuery from '../../usecases/github/graphql/issues'
import IssueCommentsQuery from '../../usecases/github/graphql/issueComments'
import ForksQuery from '../../usecases/github/graphql/forks'
import DiscussionsQuery from '../../usecases/github/graphql/discussions'
import DiscussionCommentsQuery from '../../usecases/github/graphql/discussionComments'
import { AddActivitiesSingle, Member, PlatformIdentities } from '../../types/messageTypes'
import Operations from '../../../dbOperations/operations'
import getOrganization from '../../usecases/github/graphql/organizations'
import { AppTokenResponse, getAppToken } from '../../usecases/github/rest/getAppToken'
import getMember from '../../usecases/github/graphql/members'
import PullRequestReviewThreadsQuery from '../../usecases/github/graphql/pullRequestReviewThreads'
import PullRequestReviewThreadCommentsQuery from '../../usecases/github/graphql/pullRequestReviewThreadComments'
import PullRequestCommitsQuery, {
  PullRequestCommit,
} from '../../usecases/github/graphql/pullRequestCommits'
import PullRequestCommitsQueryNoAdditions, {
  PullRequestCommitNoAdditions,
} from '../../usecases/github/graphql/pullRequestCommitsNoAdditions'
import IntegrationRunRepository from '../../../../database/repositories/integrationRunRepository'
import { IntegrationRunState } from '../../../../types/integrationRunTypes'
import IntegrationStreamRepository from '../../../../database/repositories/integrationStreamRepository'
import { DbIntegrationStreamCreateData } from '../../../../types/integrationStreamTypes'
import { sendNodeWorkerMessage } from '../../../utils/nodeWorkerSQS'
import { NodeWorkerIntegrationProcessMessage } from '../../../../types/mq/nodeWorkerIntegrationProcessMessage'
import TeamsQuery from '../../usecases/github/graphql/teams'
import { GithubWebhookTeam } from '../../usecases/github/graphql/types'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable no-case-declarations */

enum GithubStreamType {
  STARGAZERS = 'stargazers',
  FORKS = 'forks',
  PULLS = 'pulls',
  PULL_COMMENTS = 'pull-comments',
  PULL_REVIEW_THREADS = 'pull-review-threads',
  PULL_REVIEW_THREAD_COMMENTS = 'pull-review-thread-comments',
  PULL_COMMITS = 'pull-commits',
  ISSUES = 'issues',
  ISSUE_COMMENTS = 'issue-comments',
  DISCUSSIONS = 'discussions',
  DISCUSSION_COMMENTS = 'discussion-comments',
}

const IS_GITHUB_COMMIT_DATA_ENABLED = GITHUB_CONFIG.isCommitDataEnabled === 'true'

const privateKey = GITHUB_CONFIG.privateKey
  ? Buffer.from(GITHUB_CONFIG.privateKey, 'base64').toString('ascii')
  : undefined

export class GithubIntegrationService extends IntegrationServiceBase {
  private static githubAuthenticator = privateKey
    ? createAppAuth({
        appId: GITHUB_CONFIG.appId,
        clientId: GITHUB_CONFIG.clientId,
        clientSecret: GITHUB_CONFIG.clientSecret,
        privateKey,
      })
    : undefined

  constructor() {
    super(IntegrationType.GITHUB, -1)

    this.globalLimit = GITHUB_CONFIG.globalLimit || 0
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const service = new MemberAttributeSettingsService(context.repoContext)
    await service.createPredefined(GITHUB_MEMBER_ATTRIBUTES)
    await service.createPredefined(
      MemberAttributeSettingsService.pickAttributes(
        [MemberAttributeName.URL],
        TWITTER_MEMBER_ATTRIBUTES,
      ),
    )
  }

  async preprocess(context: IStepContext): Promise<void> {
    const redis = await getRedisClient(REDIS_CONFIG, true)
    const emailCache = new RedisCache('github-emails', redis, context.logger)

    const repos: Repos = []
    const unavailableRepos: Repos = []

    const reposToCheck = [
      ...context.integration.settings.repos,
      ...(context.integration.settings.unavailableRepos || []),
    ]

    for (const repo of reposToCheck) {
      try {
        // we don't need to get default 100 item per page, just 1 is enough to check if repo is available
        const stargazersQuery = new StargazersQuery(repo, context.integration.token, 1)
        await stargazersQuery.getSinglePage('')
        repos.push(repo)
      } catch (e) {
        if (e.rateLimitResetSeconds) {
          throw e
        } else {
          context.logger.warn(
            `Repo ${repo.name} will not be parsed. It is not available with the github token`,
          )
          unavailableRepos.push(repo)
        }
      }
    }

    context.integration.settings.repos = repos
    context.integration.settings.unavailableRepos = unavailableRepos

    context.pipelineData = {
      repos,
      unavailableRepos,
      emailCache,
    }
  }

  async getStreams(context: IStepContext): Promise<IPendingStream[]> {
    return context.pipelineData.repos.reduce((acc, repo) => {
      for (const endpoint of [
        GithubStreamType.STARGAZERS,
        GithubStreamType.FORKS,
        GithubStreamType.PULLS,
        GithubStreamType.ISSUES,
        GithubStreamType.DISCUSSIONS,
      ]) {
        acc.push({
          value: endpoint,
          metadata: { repo, page: '' },
        })
      }
      return acc
    }, [])
  }

  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    await timeout(1000)

    const repoName = stream.metadata.repo.name
    const event = stream.value as GithubStreamType

    const repo = GithubIntegrationService.getRepoByName(repoName, context)

    if (repo === null) {
      throw new Error(`Repo ${repoName} not found!`)
    }

    if (!repo.available) {
      throw new Error(
        `Stream ${stream.value} can't be processed since repo ${repoName} is not available!`,
      )
    }

    let result
    let newStreams: IPendingStream[]

    switch (event) {
      case GithubStreamType.STARGAZERS:
        const stargazersQuery = new StargazersQuery(repo, context.integration.token)
        result = await stargazersQuery.getSinglePage(stream.metadata.page)
        result.data = result.data.filter((i) => (i as any).node?.login)
        break
      case GithubStreamType.FORKS:
        const forksQuery = new ForksQuery(repo, context.integration.token)
        result = await forksQuery.getSinglePage(stream.metadata.page)

        // filter out activities without authors (such as bots) -- may not the case for forks, but filter out anyway
        result.data = result.data.filter((i) => (i as any).owner?.login)
        break
      case GithubStreamType.PULLS:
        const pullRequestsQuery = new PullRequestsQuery(repo, context.integration.token)
        result = await pullRequestsQuery.getSinglePage(stream.metadata.page)

        // filter out activities without authors (such as bots)
        result.data = result.data.filter((i) => (i as any).author?.login)

        // add new stream for each PR comments
        const prCommentStreams = result.data.map((pr) => ({
          value: GithubStreamType.PULL_COMMENTS,
          metadata: {
            page: '',
            repo: stream.metadata.repo,
            prNumber: pr.number,
          },
        }))

        // add new stream for each PR review thread comments
        const prReviewThreads = result.data.map((pr) => ({
          value: GithubStreamType.PULL_REVIEW_THREADS,
          metadata: {
            page: '',
            repo: stream.metadata.repo,
            prNumber: pr.number,
          },
        }))

        let prCommitsStreams: IPendingStream[] = []
        if (IS_GITHUB_COMMIT_DATA_ENABLED) {
          prCommitsStreams = result.data.map((pr) => ({
            value: GithubStreamType.PULL_COMMITS,
            metadata: {
              page: '',
              repo: stream.metadata.repo,
              prNumber: pr.number,
            },
          }))
        }

        // It is very important to keep commits first. Otherwise, we have problems
        // creating conversations if the Git integration has already ran for those data points.
        newStreams = [...prCommitsStreams, ...prCommentStreams, ...prReviewThreads]
        break
      case GithubStreamType.PULL_COMMENTS: {
        const pullRequestNumber = stream.metadata.prNumber
        const pullRequestCommentsQuery = new PullRequestCommentsQuery(
          repo,
          pullRequestNumber,
          context.integration.token,
        )

        result = await pullRequestCommentsQuery.getSinglePage(stream.metadata.page)
        result.data = result.data.filter((i) => (i as any).author?.login)
        break
      }
      case GithubStreamType.PULL_REVIEW_THREADS: {
        const pullRequestNumber = stream.metadata.prNumber
        const pullRequestReviewThreadsQuery = new PullRequestReviewThreadsQuery(
          repo,
          pullRequestNumber,
          context.integration.token,
        )

        result = await pullRequestReviewThreadsQuery.getSinglePage(stream.metadata.page)

        // add each review thread as separate stream for comments inside
        newStreams = result.data.map((reviewThread) => ({
          value: GithubStreamType.PULL_REVIEW_THREAD_COMMENTS,
          metadata: {
            page: '',
            repo: stream.metadata.repo,
            reviewThreadId: reviewThread.id,
          },
        }))

        break
      }
      case GithubStreamType.PULL_REVIEW_THREAD_COMMENTS: {
        const reviewThreadId = stream.metadata.reviewThreadId
        const pullRequestReviewThreadCommentsQuery = new PullRequestReviewThreadCommentsQuery(
          repo,
          reviewThreadId,
          context.integration.token,
        )

        result = await pullRequestReviewThreadCommentsQuery.getSinglePage(stream.metadata.page)

        // filter out activities without authors (such as bots)
        result.data = result.data.filter((i) => (i as any).author?.login)

        break
      }
      case GithubStreamType.PULL_COMMITS:
        const pullRequestNumber = stream.metadata.prNumber
        const pullRequestCommitsQuery = new PullRequestCommitsQuery(
          repo,
          pullRequestNumber,
          context.integration.token,
        )

        try {
          result = await pullRequestCommitsQuery.getSinglePage(stream.metadata.page)
        } catch (err) {
          context.logger.warn(
            {
              err,
              repo,
              pullRequestNumber,
            },
            'Error while fetching pull request commits. Trying again without additions.',
          )
          const pullRequestCommitsQueryNoAdditions = new PullRequestCommitsQueryNoAdditions(
            repo,
            pullRequestNumber,
            context.integration.token,
          )
          result = await pullRequestCommitsQueryNoAdditions.getSinglePage(stream.metadata.page)
        }
        break
      case GithubStreamType.ISSUES:
        const issuesQuery = new IssuesQuery(repo, context.integration.token)
        result = await issuesQuery.getSinglePage(stream.metadata.page)

        // filter out activities without authors (such as bots)
        result.data = result.data.filter((i) => (i as any).author?.login)

        // add each issue as separate stream
        newStreams = result.data.map((issue) => ({
          value: GithubStreamType.ISSUE_COMMENTS,
          metadata: {
            page: '',
            repo: stream.metadata.repo,
            issueNumber: issue.number,
          },
        }))
        break
      case GithubStreamType.ISSUE_COMMENTS:
        const issueNumber = stream.metadata.issueNumber
        const issueCommentsQuery = new IssueCommentsQuery(
          repo,
          issueNumber,
          context.integration.token,
        )
        result = await issueCommentsQuery.getSinglePage(stream.metadata.page)
        result.data = result.data.filter((i) => (i as any).author?.login)
        break
      case GithubStreamType.DISCUSSIONS:
        const discussionsQuery = new DiscussionsQuery(repo, context.integration.token)
        result = await discussionsQuery.getSinglePage(stream.metadata.page)

        result.data = result.data.filter((i) => (i as any).author?.login)
        newStreams = result.data
          .filter((d) => d.comments.totalCount > 0)
          .map((d) => ({
            value: GithubStreamType.DISCUSSION_COMMENTS,
            metadata: {
              page: '',
              repo: stream.metadata.repo,
              discussionNumber: d.number,
            },
          }))
        break
      case GithubStreamType.DISCUSSION_COMMENTS:
        const discussionNumber = stream.metadata.discussionNumber
        const discussionCommentsQuery = new DiscussionCommentsQuery(
          repo,
          discussionNumber,
          context.integration.token,
        )
        result = await discussionCommentsQuery.getSinglePage(stream.metadata.page)
        result.data = result.data.filter((i) => (i as any).author?.login)
        break
      default:
        throw new Error(`Unknown event '${event}'!`)
    }

    const nextPageStream = result.hasPreviousPage
      ? { value: stream.value, metadata: { repo: stream.metadata.repo, page: result.startCursor } }
      : undefined

    const activities = await GithubIntegrationService.parseActivities(
      result.data,
      stream.value as GithubStreamType,
      repo,
      context,
    )

    return {
      operations: [
        {
          type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
          records: activities,
        },
      ],
      newStreams,
      nextPageStream,
    }
  }

  async processWebhook(webhook: any, context: IStepContext): Promise<IProcessWebhookResults> {
    const records: AddActivitiesSingle[] | undefined = []

    await GithubIntegrationService.verifyWebhookSignature(
      webhook.payload.signature,
      webhook.payload.data,
    )

    const event = webhook.payload.event
    const payload = webhook.payload.data

    const redis = await getRedisClient(REDIS_CONFIG, true)
    const emailCache = new RedisCache('github-emails', redis, context.logger)

    context.pipelineData = {
      emailCache,
    }

    switch (event) {
      case 'issues': {
        const record = await GithubIntegrationService.parseWebhookIssue(payload, context)
        if (record) {
          records.push(record)
        }
        break
      }

      case 'discussion': {
        const record = await GithubIntegrationService.parseWebhookDiscussion(payload, context)
        if (record) {
          records.push(record)
        }
        break
      }

      case 'pull_request': {
        // handle case of multiple reviewers (by assigning a team as a reviewer)
        if (payload.action === 'review_requested' && payload.requested_team) {
          // a team sent as reviewer, first we need to find members in this team
          const team: GithubWebhookTeam = payload.requested_team
          const teamMembers = await new TeamsQuery(
            team.node_id,
            context.integration.token,
          ).getSinglePage('')

          for (const teamMember of teamMembers.data) {
            const reviewRequestActivity = await GithubIntegrationService.parseWebhookPullRequest(
              { ...payload, requested_reviewer: teamMember },
              context,
            )

            if (reviewRequestActivity) {
              records.push(reviewRequestActivity)
            }
          }

          break
        }

        if (payload.action === 'closed' && payload.pull_request.merged) {
          const revisedPayload = { ...payload, action: 'merged' }
          revisedPayload.pull_request.state = 'merged'

          const prMergedRecord = await GithubIntegrationService.parseWebhookPullRequest(
            revisedPayload,
            context,
          )
          if (prMergedRecord) {
            records.push(prMergedRecord)
          }
        }

        const prRecord = await GithubIntegrationService.parseWebhookPullRequest(payload, context)
        if (prRecord) {
          records.push(prRecord)
        }

        break
      }

      case 'pull_request_review': {
        const record = await GithubIntegrationService.parseWebhookPullRequestReview(
          payload,
          context,
        )
        if (record) {
          records.push(record)
        }
        break
      }

      case 'star': {
        const record = await GithubIntegrationService.parseWebhookStar(payload, context)
        if (record) {
          records.push(record)
        }
        break
      }

      case 'fork': {
        const record = await GithubIntegrationService.parseWebhookFork(payload, context)
        if (record) {
          records.push(record)
        }
        break
      }

      case 'discussion_comment':
      case 'issue_comment': {
        const record = await GithubIntegrationService.parseWebhookComment(event, payload, context)
        if (record) {
          records.push(record)
        }
        break
      }

      case 'pull_request_review_comment': {
        const record = await GithubIntegrationService.parseWebhookPullRequestReviewThreadComment(
          payload,
          context,
        )
        if (record) {
          records.push(record)
        }
        break
      }

      default:
    }

    if (records.length === 0) {
      context.logger.warn(
        {
          event,
          action: payload.action,
        },
        'No record created for event!',
      )

      return {
        operations: [],
      }
    }

    return {
      operations: [
        {
          type: Operations.UPSERT_ACTIVITIES_WITH_MEMBERS,
          records,
        },
      ],
    }
  }

  private static verifyWebhookSignature(signature: string, data: any): void {
    if (IS_TEST_ENV) {
      return
    }

    const secret = GITHUB_CONFIG.webhookSecret

    let isVerified: boolean
    try {
      isVerified = verifyGithubWebhook(signature, JSON.stringify(data), secret) // Returns true if verification succeeds; otherwise, false.
    } catch (err) {
      throw new Error(`Webhook not verified\n${err}`)
    }

    if (!isVerified) {
      throw new Error('Webhook not verified')
    }
  }

  /**
   * Parses various activity types into crowd activities.
   * @param records List of activities to be parsed
   * @param event
   * @param repo
   * @param context
   * @returns parsed activities that can be saved to the database.
   */
  private static async parseActivities(
    records: any[],
    event: GithubStreamType,
    repo: Repo,
    context: IStepContext,
  ): Promise<AddActivitiesSingle[]> {
    let activities: AddActivitiesSingle[] = []

    switch (event) {
      case GithubStreamType.STARGAZERS:
        activities = await GithubIntegrationService.parseStars(records, repo, context)
        break
      case GithubStreamType.FORKS:
        activities = await GithubIntegrationService.parseForks(records, repo, context)
        break
      case GithubStreamType.PULLS:
        activities = await GithubIntegrationService.parsePullRequests(records, repo, context)
        break
      case GithubStreamType.PULL_COMMENTS:
        activities = await GithubIntegrationService.parsePullRequestComments(records, repo, context)
        break
      case GithubStreamType.ISSUES:
        activities = await GithubIntegrationService.parseIssues(records, repo, context)
        break
      case GithubStreamType.ISSUE_COMMENTS:
        activities = await GithubIntegrationService.parseIssueComments(records, repo, context)
        break
      case GithubStreamType.DISCUSSIONS:
        activities = await GithubIntegrationService.parseDiscussions(records, repo, context)
        break
      case GithubStreamType.DISCUSSION_COMMENTS:
        activities = await GithubIntegrationService.parseDiscussionComments(records, repo, context)
        break
      case GithubStreamType.PULL_REVIEW_THREADS:
        // empty result data, we only care about comments inside review threads, this stream won't generate any activities
        activities = []
        break
      case GithubStreamType.PULL_REVIEW_THREAD_COMMENTS:
        activities = await GithubIntegrationService.parsePullRequestReviewThreadComments(
          records,
          repo,
          context,
        )
        break
      case GithubStreamType.PULL_COMMITS:
        activities = await GithubIntegrationService.parsePullRequestCommits(records, repo, context)
        break
      default:
        throw new Error(`Event not supported '${event}'!`)
    }

    return activities
  }

  public static async parseWebhookStar(
    payload: any,
    context: IStepContext,
  ): Promise<AddActivitiesSingle | undefined> {
    let type: GithubActivityType
    switch (payload.action) {
      case 'created': {
        type = GithubActivityType.STAR
        break
      }

      case 'deleted': {
        type = GithubActivityType.UNSTAR
        break
      }

      default: {
        return undefined
      }
    }
    const member = await GithubIntegrationService.parseWebhookMember(payload.sender.login, context)

    if (
      member &&
      (type === GithubActivityType.UNSTAR ||
        (type === GithubActivityType.STAR && payload.starred_at !== null))
    ) {
      const starredAt =
        type === GithubActivityType.STAR ? moment(payload.starred_at).utc() : moment().utc()

      return {
        member,
        username: member.username[PlatformType.GITHUB].username,
        type,
        timestamp: starredAt.toDate(),
        platform: PlatformType.GITHUB,
        tenant: context.integration.tenantId,
        sourceId: IntegrationServiceBase.generateSourceIdHash(
          payload.sender.login,
          type,
          starredAt.unix().toString(),
          PlatformType.GITHUB,
        ),
        sourceParentId: null,
        channel: payload.repository.html_url,
        score:
          type === 'star'
            ? GITHUB_GRID[GithubActivityType.STAR].score
            : GITHUB_GRID[GithubActivityType.UNSTAR].score,
        isContribution:
          type === 'star'
            ? GITHUB_GRID[GithubActivityType.STAR].isContribution
            : GITHUB_GRID[GithubActivityType.UNSTAR].isContribution,
      }
    }

    return undefined
  }

  private static async parseStars(
    records: any[],
    repo: Repo,
    context: IStepContext,
  ): Promise<AddActivitiesSingle[]> {
    const out: AddActivitiesSingle[] = []
    for (const record of records) {
      const member = await GithubIntegrationService.parseMember(record.node, context)
      out.push({
        tenant: context.integration.tenantId,
        username: member.username[PlatformType.GITHUB].username,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.STAR,
        sourceId: IntegrationServiceBase.generateSourceIdHash(
          record.node.login,
          GithubActivityType.STAR,
          moment(record.starredAt).utc().unix().toString(),
          PlatformType.GITHUB,
        ),
        sourceParentId: '',
        timestamp: moment(record.starredAt).utc().toDate(),
        channel: repo.url,
        member,
        score: GITHUB_GRID.star.score,
        isContribution: GITHUB_GRID.star.isContribution,
      })
    }
    return out
  }

  public static async parseWebhookFork(
    payload: any,
    context: IStepContext,
  ): Promise<AddActivitiesSingle | undefined> {
    const member: Member = await GithubIntegrationService.parseWebhookMember(
      payload.sender.login,
      context,
    )

    if (member) {
      return {
        member,
        username: member.username[PlatformType.GITHUB].username,
        type: GithubActivityType.FORK,
        timestamp: moment(payload.forkee.created_at).utc().toDate(),
        platform: PlatformType.GITHUB,
        tenant: context.integration.tenantId,
        sourceId: payload.forkee.node_id.toString(),
        sourceParentId: null,
        channel: payload.repository.html_url,
        score: GITHUB_GRID.fork.score,
        isContribution: GITHUB_GRID.fork.isContribution,
      }
    }
    return undefined
  }

  private static async parseForks(
    records: any[],
    repo: Repo,
    context: IStepContext,
  ): Promise<AddActivitiesSingle[]> {
    const out: AddActivitiesSingle[] = []

    for (const record of records) {
      const member = await GithubIntegrationService.parseMember(record.owner, context)
      out.push({
        username: member.username[PlatformType.GITHUB].username,
        tenant: context.integration.tenantId,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.FORK,
        sourceId: record.id,
        sourceParentId: '',
        timestamp: moment(record.createdAt).utc().toDate(),
        channel: repo.url,
        member,
        score: GITHUB_GRID.fork.score,
        isContribution: GITHUB_GRID.fork.isContribution,
      })
    }

    return out
  }

  public static async parseWebhookPullRequestReviewThreadComment(
    payload: any,
    context: IStepContext,
  ): Promise<AddActivitiesSingle | undefined> {
    let type: GithubActivityType
    let scoreGrid: IActivityScoringGrid
    let timestamp: string
    let sourceParentId: string
    let sourceId: string
    let body: string = ''

    switch (payload.action) {
      case 'created': {
        type = GithubActivityType.PULL_REQUEST_REVIEW_THREAD_COMMENT
        scoreGrid = GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_THREAD_COMMENT]
        timestamp = payload.comment.created_at
        sourceParentId = payload.pull_request.node_id
        sourceId = payload.comment.node_id
        body = payload.comment.body
        break
      }
      default: {
        return undefined
      }
    }

    const member = await GithubIntegrationService.parseWebhookMember(
      payload.comment.user.login,
      context,
    )

    if (member) {
      return {
        member,
        username: member.username[PlatformType.GITHUB].username,
        type,
        timestamp: moment(timestamp).utc().toDate(),
        platform: PlatformType.GITHUB,
        tenant: context.integration.tenantId,
        sourceId,
        sourceParentId,
        url: payload.comment.html_url,
        title: '',
        channel: payload.repository.html_url,
        body,
        score: scoreGrid.score,
        isContribution: scoreGrid.isContribution,
        attributes: {
          state: payload.pull_request.state,
          authorAssociation: payload.pull_request.author_association,
          labels: payload.pull_request.labels.map((l) => l.name),
        },
      }
    }

    return undefined
  }

  public static async parseWebhookPullRequestReview(
    payload: any,
    context: IStepContext,
  ): Promise<AddActivitiesSingle | undefined> {
    let type: GithubActivityType
    let scoreGrid: IActivityScoringGrid
    let timestamp: string
    let sourceParentId: string
    let sourceId: string
    let body: string = ''

    switch (payload.action) {
      case 'submitted': {
        // additional comments to existing review threads also result in submitted events
        // since these will be handled in pull_request_review_comment.created events
        // we're ignoring when state is commented and it has no body.
        if (payload.review.state === 'commented' && payload.review.body === null) {
          return undefined
        }

        type = GithubActivityType.PULL_REQUEST_REVIEWED
        scoreGrid = GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEWED]
        timestamp = payload.review.submitted_at
        sourceParentId = payload.pull_request.node_id.toString()
        sourceId = `gen-PRR_${payload.pull_request.node_id.toString()}_${
          payload.sender.login
        }_${moment(payload.review.submitted_at).utc().toISOString()}`
        body = payload.review.body
        break
      }
      default: {
        return undefined
      }
    }

    const review = payload.review
    const pull = payload.pull_request
    const member = await GithubIntegrationService.parseWebhookMember(payload.sender.login, context)

    if (member) {
      return {
        member,
        username: member.username[PlatformType.GITHUB].username,
        type,
        timestamp: moment(timestamp).utc().toDate(),
        platform: PlatformType.GITHUB,
        tenant: context.integration.tenantId,
        sourceId,
        sourceParentId,
        url: pull.html_url,
        title: '',
        channel: payload.repository.html_url,
        body,
        score: scoreGrid.score,
        isContribution: scoreGrid.isContribution,
        attributes: {
          reviewState: (payload.review?.state as string).toUpperCase(),
          state: pull.state,
          authorAssociation: pull.author_association,
          labels: pull.labels.map((l) => l.name),
        },
      }
    }

    return undefined
  }

  public static async parseWebhookPullRequest(
    payload: any,
    context: IStepContext,
  ): Promise<AddActivitiesSingle | undefined> {
    let type: GithubActivityType
    let scoreGrid: IActivityScoringGrid
    let timestamp: string
    let sourceParentId: string
    let sourceId: string
    let objectMember: Member = null
    let objectMemberUsername: string = null
    let body: string = ''
    let title: string = ''

    switch (payload.action) {
      case 'edited':
      case 'opened':
      case 'reopened': {
        type = GithubActivityType.PULL_REQUEST_OPENED
        scoreGrid = GITHUB_GRID[GithubActivityType.PULL_REQUEST_OPENED]
        timestamp = payload.pull_request.created_at
        sourceId = payload.pull_request.node_id.toString()
        sourceParentId = null
        body = payload.pull_request.body
        title = payload.pull_request.title
        break
      }

      case 'closed': {
        type = GithubActivityType.PULL_REQUEST_CLOSED
        scoreGrid = GITHUB_GRID[GithubActivityType.PULL_REQUEST_CLOSED]
        timestamp = payload.pull_request.closed_at
        sourceParentId = payload.pull_request.node_id.toString()
        sourceId = `gen-CE_${payload.pull_request.node_id.toString()}_${
          payload.sender.login
        }_${moment(payload.pull_request.closed_at).utc().toISOString()}`
        break
      }

      case 'assigned': {
        type = GithubActivityType.PULL_REQUEST_ASSIGNED
        scoreGrid = GITHUB_GRID[GithubActivityType.PULL_REQUEST_ASSIGNED]
        timestamp = payload.pull_request.updated_at
        sourceParentId = payload.pull_request.node_id.toString()
        sourceId = `gen-AE_${payload.pull_request.node_id.toString()}_${payload.sender.login}_${
          payload.assignee.login
        }_${moment(payload.pull_request.updated_at).utc().toISOString()}`
        objectMember = await GithubIntegrationService.parseWebhookMember(
          payload.assignee.login,
          context,
        )
        objectMemberUsername = objectMember.username[PlatformType.GITHUB].username
        break
      }

      case 'review_requested': {
        type = GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED
        scoreGrid = GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED]
        timestamp = payload.pull_request.updated_at
        sourceParentId = payload.pull_request.node_id.toString()
        sourceId = `gen-RRE_${payload.pull_request.node_id.toString()}_${payload.sender.login}_${
          payload.requested_reviewer.login
        }_${moment(payload.pull_request.updated_at).utc().toISOString()}`
        objectMember = await GithubIntegrationService.parseWebhookMember(
          payload.requested_reviewer.login,
          context,
        )
        objectMemberUsername = objectMember.username[PlatformType.GITHUB].username
        break
      }

      case 'merged': {
        type = GithubActivityType.PULL_REQUEST_MERGED
        scoreGrid = GITHUB_GRID[GithubActivityType.PULL_REQUEST_MERGED]
        timestamp = payload.pull_request.merged_at
        sourceParentId = payload.pull_request.node_id.toString()
        sourceId = `gen-ME_${payload.pull_request.node_id.toString()}_${
          payload.pull_request.merged_by.login
        }_${moment(payload.pull_request.merged_at).utc().toISOString()}`
        break
      }

      // this event is triggered whdn a head branch of PR receives a new commit
      case 'synchronize': {
        if (!IS_GITHUB_COMMIT_DATA_ENABLED) {
          return undefined
        }
        const prNumber = payload.number
        const integrationId = context.integration.id
        const tenantId = context.integration.tenantId
        const repoContext = context.repoContext
        const runRepo = new IntegrationRunRepository(repoContext)

        let run
        let isExistingRun = false

        const existingRun = await runRepo.findLastProcessingRun(integrationId)

        // if there is existing delayed, pending or processing run, use it
        if (existingRun) {
          run = existingRun
          isExistingRun = true
        } else {
          // otherwise create a new run
          run = await runRepo.create({
            integrationId,
            tenantId,
            onboarding: false,
            state: IntegrationRunState.PENDING,
          })
        }

        const githubRepo: Repo = {
          name: payload.repository.name,
          owner: payload.repository.owner.login,
          url: payload.repository.html_url,
          createdAt: payload.repository.created_at,
        }

        const streamRepo = new IntegrationStreamRepository(repoContext)
        const stream: DbIntegrationStreamCreateData = {
          runId: run.id, // we tie up a stream to an existing run or to a new one
          tenantId,
          integrationId,
          name: GithubStreamType.PULL_COMMITS,
          metadata: {
            page: '',
            repo: githubRepo,
            prNumber,
          },
        }
        // create a new stream
        await streamRepo.create(stream)

        if (!isExistingRun) {
          // if we created a new run, we need to notify the node worker
          // test again
          await sendNodeWorkerMessage(tenantId, new NodeWorkerIntegrationProcessMessage(run.id))
        }
        return undefined
      }

      default: {
        return undefined
      }
    }

    const member = await GithubIntegrationService.parseWebhookMember(payload.sender.login, context)

    const pull = payload.pull_request

    if (member) {
      return {
        member,
        username: member.username[PlatformType.GITHUB].username,
        objectMemberUsername,
        objectMember,
        type,
        timestamp: moment(timestamp).utc().toDate(),
        platform: PlatformType.GITHUB,
        tenant: context.integration.tenantId,
        sourceId,
        sourceParentId,
        url: pull.html_url,
        title,
        channel: payload.repository.html_url,
        body,
        score: scoreGrid.score,
        isContribution: scoreGrid.isContribution,
        attributes: {
          state: pull.state,
          additions: pull.additions,
          deletions: pull.deletions,
          changedFiles: pull.changed_files,
          authorAssociation: pull.author_association,
          labels: pull.labels.map((l) => l.name),
        },
      }
    }

    return undefined
  }

  private static async parsePullRequestEvents(
    records: any[],
    pullRequest: AddActivitiesSingle,
    context: IStepContext,
  ): Promise<AddActivitiesSingle[]> {
    const out: AddActivitiesSingle[] = []

    for (const record of records) {
      switch (record.__typename) {
        case GithubPullRequestEvents.ASSIGN:
          if (record.actor?.login && record.assignee?.login) {
            const member = await GithubIntegrationService.parseMember(record.actor, context)
            const objectMember = await GithubIntegrationService.parseMember(
              record.assignee,
              context,
            )
            out.push({
              username: member.username[PlatformType.GITHUB].username,
              objectMemberUsername: objectMember.username[PlatformType.GITHUB].username,
              tenant: context.integration.tenantId,
              platform: PlatformType.GITHUB,
              type: GithubActivityType.PULL_REQUEST_ASSIGNED,
              sourceId: `gen-AE_${pullRequest.sourceId}_${record.actor.login}_${
                record.assignee.login
              }_${moment(record.createdAt).utc().toISOString()}`,
              sourceParentId: pullRequest.sourceId,
              timestamp: moment(record.createdAt).utc().toDate(),
              body: '',
              url: pullRequest.url,
              channel: pullRequest.channel,
              title: '',
              attributes: {
                state: (pullRequest.attributes as any).state,
                additions: (pullRequest.attributes as any).additions,
                deletions: (pullRequest.attributes as any).deletions,
                changedFiles: (pullRequest.attributes as any).changedFiles,
                authorAssociation: (pullRequest.attributes as any).authorAssociation,
                labels: (pullRequest.attributes as any).labels,
              },
              member,
              objectMember,
              score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_ASSIGNED].score,
              isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_ASSIGNED].isContribution,
            })
          }

          break
        case GithubPullRequestEvents.REQUEST_REVIEW:
          if (
            record?.actor?.login &&
            (record?.requestedReviewer?.login || record?.requestedReviewer?.members)
          ) {
            // Requested review from single member
            if (record?.requestedReviewer?.login) {
              const member = await GithubIntegrationService.parseMember(record.actor, context)
              const objectMember = await GithubIntegrationService.parseMember(
                record.requestedReviewer,
                context,
              )
              out.push({
                username: member.username[PlatformType.GITHUB].username,
                objectMemberUsername: objectMember.username[PlatformType.GITHUB].username,
                tenant: context.integration.tenantId,
                platform: PlatformType.GITHUB,
                type: GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED,
                sourceId: `gen-RRE_${pullRequest.sourceId}_${record.actor.login}_${
                  record.requestedReviewer.login
                }_${moment(record.createdAt).utc().toISOString()}`,
                sourceParentId: pullRequest.sourceId,
                timestamp: moment(record.createdAt).utc().toDate(),
                body: '',
                url: pullRequest.url,
                channel: pullRequest.channel,
                title: '',
                attributes: {
                  state: (pullRequest.attributes as any).state,
                  additions: (pullRequest.attributes as any).additions,
                  deletions: (pullRequest.attributes as any).deletions,
                  changedFiles: (pullRequest.attributes as any).changedFiles,
                  authorAssociation: (pullRequest.attributes as any).authorAssociation,
                  labels: (pullRequest.attributes as any).labels,
                },
                member,
                objectMember,
                score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED].score,
                isContribution:
                  GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED].isContribution,
              })
            } else if (record?.requestedReviewer?.members) {
              // review is requested from a team
              const member = await GithubIntegrationService.parseMember(record.actor, context)

              for (const teamMember of record.requestedReviewer.members.nodes) {
                const objectMember = await GithubIntegrationService.parseMember(teamMember, context)

                out.push({
                  username: member.username[PlatformType.GITHUB].username,
                  objectMemberUsername: objectMember.username[PlatformType.GITHUB].username,
                  tenant: context.integration.tenantId,
                  platform: PlatformType.GITHUB,
                  type: GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED,
                  sourceId: `gen-RRE_${pullRequest.sourceId}_${record.actor.login}_${
                    objectMember.username[PlatformType.GITHUB].username
                  }_${moment(record.createdAt).utc().toISOString()}`,
                  sourceParentId: pullRequest.sourceId,
                  timestamp: moment(record.createdAt).utc().toDate(),
                  body: '',
                  url: pullRequest.url,
                  channel: pullRequest.channel,
                  title: '',
                  attributes: {
                    state: (pullRequest.attributes as any).state,
                    additions: (pullRequest.attributes as any).additions,
                    deletions: (pullRequest.attributes as any).deletions,
                    changedFiles: (pullRequest.attributes as any).changedFiles,
                    authorAssociation: (pullRequest.attributes as any).authorAssociation,
                    labels: (pullRequest.attributes as any).labels,
                  },
                  member,
                  objectMember,
                  score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED].score,
                  isContribution:
                    GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED].isContribution,
                })
              }
            }
          }

          break
        case GithubPullRequestEvents.REVIEW:
          if (record?.author?.login && record?.submittedAt) {
            const member = await GithubIntegrationService.parseMember(record.author, context)
            out.push({
              username: member.username[PlatformType.GITHUB].username,
              tenant: context.integration.tenantId,
              platform: PlatformType.GITHUB,
              type: GithubActivityType.PULL_REQUEST_REVIEWED,
              sourceId: `gen-PRR_${pullRequest.sourceId}_${record.author.login}_${moment(
                record.submittedAt,
              )
                .utc()
                .toISOString()}`,
              sourceParentId: pullRequest.sourceId,
              timestamp: moment(record.submittedAt).utc().toDate(),
              body: record.body,
              url: pullRequest.url,
              channel: pullRequest.channel,
              title: '',
              attributes: {
                reviewState: record.state,
                state: (pullRequest.attributes as any).state,
                additions: (pullRequest.attributes as any).additions,
                deletions: (pullRequest.attributes as any).deletions,
                changedFiles: (pullRequest.attributes as any).changedFiles,
                authorAssociation: (pullRequest.attributes as any).authorAssociation,
                labels: (pullRequest.attributes as any).labels,
              },
              member,
              score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEWED].score,
              isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEWED].isContribution,
            })
          }

          break
        case GithubPullRequestEvents.MERGE:
          if (record?.actor?.login) {
            const member = await GithubIntegrationService.parseMember(record.actor, context)
            out.push({
              username: member.username[PlatformType.GITHUB].username,
              tenant: context.integration.tenantId,
              platform: PlatformType.GITHUB,
              type: GithubActivityType.PULL_REQUEST_MERGED,
              sourceId: `gen-ME_${pullRequest.sourceId}_${record.actor.login}_${moment(
                record.createdAt,
              )
                .utc()
                .toISOString()}`,
              sourceParentId: pullRequest.sourceId,
              timestamp: moment(record.createdAt).utc().toDate(),
              body: '',
              url: pullRequest.url,
              channel: pullRequest.channel,
              title: '',
              attributes: {
                state: (pullRequest.attributes as any).state,
                additions: (pullRequest.attributes as any).additions,
                deletions: (pullRequest.attributes as any).deletions,
                changedFiles: (pullRequest.attributes as any).changedFiles,
                authorAssociation: (pullRequest.attributes as any).authorAssociation,
                labels: (pullRequest.attributes as any).labels,
              },
              member,
              score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_MERGED].score,
              isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_MERGED].isContribution,
            })
          }

          break
        case GithubPullRequestEvents.CLOSE:
          if (record?.actor?.login) {
            const member = await GithubIntegrationService.parseMember(record.actor, context)
            out.push({
              username: member.username[PlatformType.GITHUB].username,
              tenant: context.integration.tenantId,
              platform: PlatformType.GITHUB,
              type: GithubActivityType.PULL_REQUEST_CLOSED,
              sourceId: `gen-CE_${pullRequest.sourceId}_${record.actor.login}_${moment(
                record.createdAt,
              )
                .utc()
                .toISOString()}`,
              sourceParentId: pullRequest.sourceId,
              timestamp: moment(record.createdAt).utc().toDate(),
              body: '',
              url: pullRequest.url,
              channel: pullRequest.channel,
              title: '',
              attributes: {
                state: (pullRequest.attributes as any).state,
                additions: (pullRequest.attributes as any).additions,
                deletions: (pullRequest.attributes as any).deletions,
                changedFiles: (pullRequest.attributes as any).changedFiles,
                authorAssociation: (pullRequest.attributes as any).authorAssociation,
                labels: (pullRequest.attributes as any).labels,
              },
              member,
              score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_CLOSED].score,
              isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_CLOSED].isContribution,
            })
          }

          break
        default:
          context.logger.warn(
            `Unsupported pull request event:  ${record.__typename}. This event will not be parsed.`,
          )
      }
    }
    return out
  }

  private static async parsePullRequestCommits(
    records: any[],
    repo: Repo,
    context: IStepContext,
  ): Promise<AddActivitiesSingle[]> {
    const out: AddActivitiesSingle[] = []
    const data = records[0] as PullRequestCommit | PullRequestCommitNoAdditions
    const commits = data.repository.pullRequest.commits.nodes

    for (const record of commits) {
      for (const author of record.commit.authors.nodes) {
        if (!author || !author.user || !author.user.login) {
          // eslint-disable-next-line no-continue
          continue
        }
        const member = await GithubIntegrationService.parseMember(author.user, context)
        out.push({
          tenant: context.integration.tenantId,
          username: member.username[PlatformType.GITHUB].username,
          platform: PlatformType.GITHUB,
          channel: repo.url,
          url: `${repo.url}/commit/${record.commit.oid}`,
          body: record.commit.message,
          type: 'authored-commit',
          sourceId: record.commit.oid,
          sourceParentId: `${data.repository.pullRequest.id}`,
          timestamp: moment(record.commit.authoredDate).utc().toDate(),
          attributes: {
            insertions: 'additions' in record.commit ? record.commit.additions : 0,
            deletions: 'deletions' in record.commit ? record.commit.deletions : 0,
            lines:
              'additions' in record.commit && 'deletions' in record.commit
                ? record.commit.additions - record.commit.deletions
                : 0,
            isMerge: record.commit.parents.totalCount > 1,
          },
          member,
        })
      }
    }

    return out
  }

  private static async parsePullRequestReviewThreadComments(
    records: any[],
    repo: Repo,
    context: IStepContext,
  ): Promise<AddActivitiesSingle[]> {
    const out: AddActivitiesSingle[] = []

    for (const record of records) {
      const member = await GithubIntegrationService.parseMember(record.author, context)
      out.push({
        tenant: context.integration.tenantId,
        username: member.username[PlatformType.GITHUB].username,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.PULL_REQUEST_REVIEW_THREAD_COMMENT,
        sourceId: record.id,
        sourceParentId: record.pullRequest.id,
        timestamp: moment(record.createdAt).utc().toDate(),
        body: record.bodyText,
        url: record.url,
        channel: repo.url,
        title: '',
        attributes: {
          state: record.pullRequest.state.toLowerCase(),
          additions: record.pullRequest.additions,
          deletions: record.pullRequest.deletions,
          changedFiles: record.pullRequest.changedFiles,
          authorAssociation: record.pullRequest.authorAssociation,
          labels: record.pullRequest.labels?.nodes.map((l) => l.name),
        },
        member,
        score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_THREAD_COMMENT].score,
        isContribution:
          GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_THREAD_COMMENT].isContribution,
      })
    }

    return out
  }

  private static async parsePullRequests(
    records: any[],
    repo: Repo,
    context: IStepContext,
  ): Promise<AddActivitiesSingle[]> {
    const out: AddActivitiesSingle[] = []

    for (const record of records) {
      const member = await GithubIntegrationService.parseMember(record.author, context)
      out.push({
        tenant: context.integration.tenantId,
        username: member.username[PlatformType.GITHUB].username,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.PULL_REQUEST_OPENED,
        sourceId: record.id,
        sourceParentId: '',
        timestamp: moment(record.createdAt).utc().toDate(),
        body: record.bodyText,
        url: record.url ? record.url : '',
        channel: repo.url,
        title: record.title,
        attributes: {
          state: record.state.toLowerCase(),
          additions: record.additions,
          deletions: record.deletions,
          changedFiles: record.changedFiles,
          authorAssociation: record.authorAssociation,
          labels: record.labels?.nodes.map((l) => l.name),
        },
        member,
        score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_OPENED].score,
        isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_OPENED].isContribution,
      })

      // parse pr events
      out.push(
        ...(await GithubIntegrationService.parsePullRequestEvents(
          record.timelineItems.nodes,
          out[out.length - 1],
          context,
        )),
      )
    }

    return out
  }

  public static async parseWebhookComment(
    event: string,
    payload: any,
    context: IStepContext,
  ): Promise<AddActivitiesSingle | undefined> {
    let type: GithubActivityType
    let sourceParentId: string | undefined

    switch (event) {
      case 'discussion_comment': {
        switch (payload.action) {
          case 'created':
          case 'edited':
            type = GithubActivityType.DISCUSSION_COMMENT
            sourceParentId = payload.discussion.node_id.toString()
            break
          default:
            return undefined
        }
        break
      }

      case 'issue_comment': {
        switch (payload.action) {
          case 'created':
          case 'edited': {
            if ('pull_request' in payload.issue) {
              type = GithubActivityType.PULL_REQUEST_COMMENT
            } else {
              type = GithubActivityType.ISSUE_COMMENT
            }
            sourceParentId = payload.issue.node_id.toString()
            break
          }

          default:
            return undefined
        }
        break
      }

      default: {
        return undefined
      }
    }

    const member = await GithubIntegrationService.parseWebhookMember(payload.sender.login, context)
    if (member) {
      const comment = payload.comment
      return {
        member,
        username: member.username[PlatformType.GITHUB].username,
        type,
        timestamp: moment(comment.created_at).utc().toDate(),
        platform: PlatformType.GITHUB,
        tenant: context.integration.tenantId,
        sourceId: comment.node_id.toString(),
        sourceParentId,
        url: comment.html_url,
        body: comment.body,
        channel: payload.repository.html_url,
        score: GITHUB_GRID[type].score,
        isContribution: GITHUB_GRID[type].isContribution,
      }
    }

    return undefined
  }

  private static async parsePullRequestComments(
    records: any[],
    repo: Repo,
    context: IStepContext,
  ): Promise<AddActivitiesSingle[]> {
    const out: AddActivitiesSingle[] = []
    for (const record of records) {
      const member = await GithubIntegrationService.parseMember(record.author, context)
      out.push({
        username: member.username[PlatformType.GITHUB].username,
        tenant: context.integration.tenantId,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.PULL_REQUEST_COMMENT,
        sourceId: record.id,
        sourceParentId: record.pullRequest.id,
        timestamp: moment(record.createdAt).utc().toDate(),
        url: record.url,
        body: record.bodyText,
        channel: repo.url,
        member,
        score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_COMMENT].score,
        isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_COMMENT].isContribution,
      })
    }
    return out
  }

  public static async parseWebhookIssue(
    payload: any,
    context: IStepContext,
  ): Promise<AddActivitiesSingle | undefined> {
    let type: GithubActivityType
    let scoreGrid: IActivityScoringGrid
    let timestamp: string
    let sourceId: string
    let sourceParentId: string
    let body: string = ''
    let title: string = ''

    switch (payload.action) {
      case 'edited':
      case 'opened':
      case 'reopened':
        type = GithubActivityType.ISSUE_OPENED
        scoreGrid = GITHUB_GRID[GithubActivityType.ISSUE_OPENED]
        timestamp = payload.issue.created_at
        sourceParentId = null
        sourceId = payload.issue.node_id.toString()
        body = payload.issue.body
        title = payload.issue.title
        break

      case 'closed':
        type = GithubActivityType.ISSUE_CLOSED
        scoreGrid = GITHUB_GRID[GithubActivityType.ISSUE_CLOSED]
        timestamp = payload.issue.closed_at
        sourceParentId = payload.issue.node_id.toString()
        sourceId = `gen-CE_${payload.issue.node_id.toString()}_${payload.sender.login}_${moment(
          payload.issue.closed_at,
        )
          .utc()
          .toISOString()}`
        break

      default:
        return undefined
    }

    const issue = payload.issue
    const member = await GithubIntegrationService.parseWebhookMember(payload.sender.login, context)

    if (member) {
      return {
        member,
        username: member.username[PlatformType.GITHUB].username,
        type,
        timestamp: moment(timestamp).utc().toDate(),
        platform: PlatformType.GITHUB,
        tenant: context.integration.tenantId,
        sourceId,
        sourceParentId,
        url: issue.html_url,
        title,
        channel: payload.repository.html_url,
        body,
        attributes: {
          state: issue.state,
        },
        score: scoreGrid.score,
        isContribution: scoreGrid.isContribution,
      }
    }

    return undefined
  }

  private static async parseIssues(
    records: any[],
    repo: Repo,
    context: IStepContext,
  ): Promise<AddActivitiesSingle[]> {
    const out: AddActivitiesSingle[] = []

    for (const record of records) {
      const member = await GithubIntegrationService.parseMember(record.author, context)
      out.push({
        tenant: context.integration.tenantId,
        username: member.username[PlatformType.GITHUB].username,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.ISSUE_OPENED,
        sourceId: record.id,
        sourceParentId: '',
        timestamp: moment(record.createdAt).utc().toDate(),
        body: record.bodyText,
        url: record.url ? record.url : '',
        channel: repo.url,
        title: record.title.replace(/\0/g, ''),
        attributes: {
          state: record.state.toLowerCase(),
        },
        member,
        score: GITHUB_GRID[GithubActivityType.ISSUE_OPENED].score,
        isContribution: GITHUB_GRID[GithubActivityType.ISSUE_OPENED].isContribution,
      })

      // parse issue events
      out.push(
        ...(await GithubIntegrationService.parseIssueEvents(
          record.timelineItems.nodes,
          out[out.length - 1],
          context,
        )),
      )
    }

    return out
  }

  private static async parseIssueEvents(
    records: any[],
    issue: AddActivitiesSingle,
    context: IStepContext,
  ): Promise<AddActivitiesSingle[]> {
    const out: AddActivitiesSingle[] = []

    for (const record of records) {
      switch (record.__typename) {
        case GithubPullRequestEvents.CLOSE:
          if (record.actor?.login) {
            const member = await GithubIntegrationService.parseMember(record.actor, context)
            out.push({
              username: member.username[PlatformType.GITHUB].username,
              tenant: context.integration.tenantId,
              platform: PlatformType.GITHUB,
              type: GithubActivityType.ISSUE_CLOSED,
              sourceId: `gen-CE_${issue.sourceId}_${record.actor.login}_${moment(record.createdAt)
                .utc()
                .toISOString()}`,
              sourceParentId: issue.sourceId,
              timestamp: moment(record.createdAt).utc().toDate(),
              body: '',
              url: issue.url,
              channel: issue.channel,
              title: '',
              attributes: {
                state: (issue.attributes as any).state,
              },
              member,
              score: GITHUB_GRID[GithubActivityType.ISSUE_CLOSED].score,
              isContribution: GITHUB_GRID[GithubActivityType.ISSUE_CLOSED].isContribution,
            })
          }

          break
        default:
          context.logger.warn(
            `Unsupported issue event:  ${record.__typename}. This event will not be parsed.`,
          )
      }
    }
    return out
  }

  private static async parseIssueComments(
    records: any[],
    repo: Repo,
    context: IStepContext,
  ): Promise<AddActivitiesSingle[]> {
    const out: AddActivitiesSingle[] = []
    for (const record of records) {
      const member = await GithubIntegrationService.parseMember(record.author, context)
      out.push({
        tenant: context.integration.tenantId,
        username: member.username[PlatformType.GITHUB].username,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.ISSUE_COMMENT,
        sourceId: record.id,
        sourceParentId: record.issue.id,
        timestamp: moment(record.createdAt).utc().toDate(),
        url: record.url,
        body: record.bodyText,
        channel: repo.url,
        member,
        score: GITHUB_GRID[GithubActivityType.ISSUE_COMMENT].score,
        isContribution: GITHUB_GRID[GithubActivityType.ISSUE_COMMENT].isContribution,
      })
    }
    return out
  }

  public static async parseWebhookDiscussion(
    payload: any,
    context: IStepContext,
  ): Promise<AddActivitiesSingle | undefined> {
    if (payload.action === 'answered') {
      return this.parseWebhookDiscussionComments(payload, context)
    }

    if (!['edited', 'created'].includes(payload.action)) {
      return undefined
    }

    const discussion = payload.discussion
    const member = await GithubIntegrationService.parseWebhookMember(discussion.user.login, context)

    if (member) {
      return {
        member,
        username: member.username[PlatformType.GITHUB].username,
        type: GithubActivityType.DISCUSSION_STARTED,
        timestamp: moment(discussion.created_at).utc().toDate(),
        platform: PlatformType.GITHUB,
        tenant: context.integration.tenantId,
        sourceId: discussion.node_id.toString(),
        sourceParentId: null,
        url: discussion.html_url,
        title: discussion.title,
        channel: payload.repository.html_url,
        body: discussion.body,
        attributes: {
          category: {
            id: discussion.category.node_id,
            isAnswerable: discussion.category.is_answerable,
            name: discussion.category.name,
            slug: discussion.category.slug,
            emoji: discussion.category.emoji,
            description: discussion.category.description,
          },
        },
        score: GITHUB_GRID[GithubActivityType.DISCUSSION_STARTED].score,
        isContribution: GITHUB_GRID[GithubActivityType.DISCUSSION_STARTED].isContribution,
      }
    }

    return undefined
  }

  private static async parseDiscussions(
    records: any[],
    repo: Repo,
    context: IStepContext,
  ): Promise<AddActivitiesSingle[]> {
    const out: AddActivitiesSingle[] = []

    for (const record of records) {
      const member = await GithubIntegrationService.parseMember(record.author, context)
      out.push({
        username: member.username[PlatformType.GITHUB].username,
        tenant: context.integration.tenantId,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.DISCUSSION_STARTED,
        sourceId: record.id,
        sourceParentId: '',
        timestamp: moment(record.createdAt).utc().toDate(),
        body: record.bodyText,
        url: record.url ? record.url : '',
        channel: repo.url,
        title: record.title,
        attributes: {
          category: {
            id: record.category.id,
            isAnswerable: record.category.isAnswerable,
            name: record.category.name,
            slug: record.category.slug,
            emoji: record.category.emoji,
            description: record.category.description,
          },
        },
        member,
        score: GITHUB_GRID[GithubActivityType.DISCUSSION_STARTED].score,
        isContribution: GITHUB_GRID[GithubActivityType.DISCUSSION_STARTED].isContribution,
      })
    }
    return out
  }

  private static async parseWebhookDiscussionComments(
    payload: any,
    context: IStepContext,
  ): Promise<AddActivitiesSingle | undefined> {
    const member: Member = await this.parseWebhookMember(payload.sender.login, context)

    if (member) {
      const answer = payload.answer
      return {
        member,
        username: member.username[PlatformType.GITHUB].username,
        type: GithubActivityType.DISCUSSION_COMMENT,
        timestamp: moment(answer.created_at).utc().toDate(),
        platform: PlatformType.GITHUB,
        tenant: context.integration.tenantId,
        sourceId: answer.node_id.toString(),
        sourceParentId: payload.discussion.node_id.toString(),
        attributes: {
          isSelectedAnswer: true,
        },
        channel: payload.repository.html_url,
        body: answer.body,
        url: answer.html_url,
        score: GITHUB_GRID[GithubActivityType.DISCUSSION_COMMENT].score + 2,
        isContribution: GITHUB_GRID[GithubActivityType.DISCUSSION_COMMENT].isContribution,
      }
    }

    return undefined
  }

  private static async parseDiscussionComments(
    records: any[],
    repo: Repo,
    context: IStepContext,
  ): Promise<AddActivitiesSingle[]> {
    const out: AddActivitiesSingle[] = []

    for (const record of records) {
      if (!('author' in record)) {
        // eslint-disable-next-line no-continue
        continue
      }
      const commentId = record.id
      const member = await GithubIntegrationService.parseMember(record.author, context)

      out.push({
        username: member.username[PlatformType.GITHUB].username,
        tenant: context.integration.tenantId,
        platform: PlatformType.GITHUB,
        type: GithubActivityType.DISCUSSION_COMMENT,
        sourceId: commentId,
        sourceParentId: record.discussion.id,
        timestamp: moment(record.createdAt).utc().toDate(),
        url: record.url,
        body: record.bodyText,
        channel: repo.url,
        attributes: {
          isAnswer: record.isAnswer ?? undefined,
        },
        member,
        score: record.isAnswer
          ? GITHUB_GRID[GithubActivityType.DISCUSSION_COMMENT].score + 2
          : GITHUB_GRID[GithubActivityType.DISCUSSION_COMMENT].score,
        isContribution: GITHUB_GRID[GithubActivityType.DISCUSSION_COMMENT].isContribution,
      })

      for (const reply of record.replies.nodes) {
        if (!('author' in reply) || !reply?.author || !reply?.author?.login) {
          // eslint-disable-next-line no-continue
          continue
        }
        const member = await GithubIntegrationService.parseMember(reply.author, context)
        out.push({
          username: member.username[PlatformType.GITHUB].username,
          tenant: context.integration.tenantId,
          platform: PlatformType.GITHUB,
          type: GithubActivityType.DISCUSSION_COMMENT,
          sourceId: reply.id,
          sourceParentId: commentId,
          timestamp: moment(reply.createdAt).utc().toDate(),
          url: reply.url,
          body: reply.bodyText,
          channel: repo.url,
          member,
          score: GITHUB_GRID[GithubActivityType.DISCUSSION_COMMENT].score,
          isContribution: GITHUB_GRID[GithubActivityType.DISCUSSION_COMMENT].isContribution,
        })
      }
    }

    return out
  }

  private static async getAppToken(context: IStepContext): Promise<string> {
    if (this.githubAuthenticator) {
      let appToken: AppTokenResponse
      if (context.pipelineData.appToken) {
        // check expiration
        const expiration = moment(context.pipelineData.appToken.expiration).add(5, 'minutes')
        if (expiration.isAfter(moment())) {
          // need to refresh
          const authResponse = await this.githubAuthenticator({ type: 'app' })
          const jwtToken = authResponse.token
          appToken = await getAppToken(jwtToken, context.integration.integrationIdentifier)
        } else {
          appToken = context.pipelineData.appToken
        }
      } else {
        const authResponse = await this.githubAuthenticator({ type: 'app' })
        const jwtToken = authResponse.token
        appToken = await getAppToken(jwtToken, context.integration.integrationIdentifier)
      }

      context.pipelineData.appToken = appToken

      return appToken.token
    }

    throw new Error('GitHub integration is not configured!')
  }

  private static async getMemberData(context: IStepContext, login: string): Promise<any> {
    const appToken = await this.getAppToken(context)
    return getMember(login, appToken)
  }

  private static async getMemberEmail(context: IStepContext, login: string): Promise<string> {
    if (IS_TEST_ENV) {
      return ''
    }

    const cache: RedisCache = context.pipelineData.emailCache

    const existing = await cache.get(login)
    if (existing) {
      if (existing === 'null') {
        return ''
      }

      return existing
    }

    const member = await this.getMemberData(context, login)
    const email = (member && member.email ? member.email : '').trim()
    if (email && email.length > 0) {
      await cache.set(login, email, 60 * 60)
      return email
    }

    await cache.set(login, 'null', 60 * 60)
    return ''
  }

  private static async parseWebhookMember(
    login: string,
    context: IStepContext,
  ): Promise<Member | undefined> {
    if (IS_TEST_ENV) {
      return {
        username: {
          [PlatformType.GITHUB]: {
            username: 'testMember',
            integrationId: context.integration.id,
          },
        } as PlatformIdentities,
      }
    }

    const member = await getMember(login, context.integration.token)
    if (member) {
      return GithubIntegrationService.parseMember(member, context)
    }

    return undefined
  }

  public static async parseMember(memberFromApi: any, context: IStepContext): Promise<Member> {
    const email = await this.getMemberEmail(context, memberFromApi.login)

    const member: Member = {
      username: {
        [PlatformType.GITHUB]: {
          username: memberFromApi.login,
          integrationId: context.integration.id,
        },
      } as PlatformIdentities,
      displayName: memberFromApi?.name?.trim() || memberFromApi.login,
      attributes: {
        [MemberAttributeName.IS_HIREABLE]: {
          [PlatformType.GITHUB]: memberFromApi.isHireable || false,
        },
        [MemberAttributeName.URL]: {
          [PlatformType.GITHUB]: memberFromApi.url,
        },
        [MemberAttributeName.BIO]: {
          [PlatformType.GITHUB]: memberFromApi.bio || '',
        },
        [MemberAttributeName.LOCATION]: {
          [PlatformType.GITHUB]: memberFromApi.location || '',
        },
        [MemberAttributeName.AVATAR_URL]: {
          [PlatformType.GITHUB]: memberFromApi.avatarUrl || '',
        },
      },
      emails: email ? [email] : [],
    }

    if (memberFromApi.websiteUrl) {
      member.attributes[MemberAttributeName.WEBSITE_URL] = {
        [PlatformType.GITHUB]: memberFromApi.websiteUrl,
      }
    }

    if (memberFromApi.company) {
      if (IS_TEST_ENV) {
        member.organizations = [{ name: 'crowd.dev' }]
      } else {
        const company = memberFromApi.company.replace('@', '').trim()
        const fromAPI = await getOrganization(company, context.integration.token)

        if (fromAPI) {
          member.organizations = [
            {
              name: fromAPI.name,
              description: fromAPI.description ?? null,
              location: fromAPI.location ?? null,
              logo: fromAPI.avatarUrl ?? null,
              url: fromAPI.url ?? null,
              github: fromAPI.url
                ? { handle: fromAPI.url.replace('https://github.com/', '') }
                : null,
              twitter: fromAPI.twitterUsername ? { handle: fromAPI.twitterUsername } : null,
              website: fromAPI.websiteUrl ?? null,
            },
          ]
        } else {
          member.organizations = [{ name: company }]
        }
      }
    }
    // TODO Fix this (multiple member identities with secondary identities)
    // if (memberFromApi.twitterUsername) {
    //   member.attributes[MemberAttributeName.URL][
    //     PlatformType.TWITTER
    //   ] = `https://twitter.com/${memberFromApi.twitterUsername}`
    //   member.username[PlatformType.TWITTER] = {
    //     username: memberFromApi.twitterUsername,
    //     integrationId: context.integration.id,
    //   }
    // }

    if (memberFromApi.followers && memberFromApi.followers.totalCount > 0) {
      member.reach = { [PlatformType.GITHUB]: memberFromApi.followers.totalCount }
    }

    return member
  }

  /**
   * Searches given repository name among installed repositories
   * Returns null if given repo is not found.
   * @param name  The tenant we are working on
   * @param context
   * @returns Found repo object
   */
  private static getRepoByName(name: string, context: IStepContext): Repo | null {
    const availableRepo: Repo | undefined = singleOrDefault(
      context.pipelineData.repos,
      (r) => r.name === name,
    )
    if (availableRepo) {
      return { ...availableRepo, available: true }
    }

    const unavailableRepo: Repo | undefined = singleOrDefault(
      context.pipelineData.unavailableRepos,
      (r) => r.name === name,
    )
    if (unavailableRepo) {
      return { ...unavailableRepo, available: false }
    }

    return null
  }
}
