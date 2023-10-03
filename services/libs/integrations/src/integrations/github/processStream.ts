/* eslint-disable  @typescript-eslint/no-explicit-any */
// processStream.ts content
import { singleOrDefault, timeout } from '@crowd/common'
import { GraphQlQueryResponse, IConcurrentRequestLimiter } from '@crowd/types'
import { createAppAuth } from '@octokit/auth-app'
import { AuthInterface } from '@octokit/auth-app/dist-types/types'
import {
  IProcessStreamContext,
  ProcessStreamHandler,
  IProcessWebhookStreamContext,
} from '../../types'
import DiscussionCommentsQuery from './api/graphql/discussionComments'
import DiscussionsQuery from './api/graphql/discussions'
import ForksQuery from './api/graphql/forks'
import IssueCommentsQuery from './api/graphql/issueComments'
import IssuesQuery from './api/graphql/issues'
import getMember from './api/graphql/members'
import getOrganization from './api/graphql/organizations'
import PullRequestCommentsQuery from './api/graphql/pullRequestComments'
import PullRequestCommitsQuery, { PullRequestCommit } from './api/graphql/pullRequestCommits'
import PullRequestCommitsQueryNoAdditions, {
  PullRequestCommitNoAdditions,
} from './api/graphql/pullRequestCommitsNoAdditions'
import PullRequestReviewThreadCommentsQuery from './api/graphql/pullRequestReviewThreadComments'
import PullRequestReviewThreadsQuery from './api/graphql/pullRequestReviewThreads'
import PullRequestsQuery from './api/graphql/pullRequests'
import StargazersQuery from './api/graphql/stargazers'
import {
  GithubActivitySubType,
  GithubActivityType,
  GithubApiData,
  GithubBasicStream,
  GithubIntegrationSettings,
  GithubPlatformSettings,
  GithubPrepareMemberOutput,
  GithubPullRequestEvents,
  GithubRootStream,
  GithubStreamType,
  Repo,
  Repos,
} from './types'

const IS_TEST_ENV: boolean = process.env.NODE_ENV === 'test'

let githubAuthenticator: AuthInterface | undefined = undefined
let concurrentRequestLimiter: IConcurrentRequestLimiter | undefined = undefined

function getAuth(ctx: IProcessStreamContext): AuthInterface | undefined {
  const GITHUB_CONFIG = ctx.platformSettings as GithubPlatformSettings
  const privateKey = GITHUB_CONFIG.privateKey
    ? Buffer.from(GITHUB_CONFIG.privateKey, 'base64').toString('ascii')
    : undefined

  if (githubAuthenticator === undefined) {
    githubAuthenticator = privateKey
      ? createAppAuth({
          appId: GITHUB_CONFIG.appId,
          clientId: GITHUB_CONFIG.clientId,
          clientSecret: GITHUB_CONFIG.clientSecret,
          privateKey,
        })
      : undefined
  }
  return githubAuthenticator
}

export function getConcurrentRequestLimiter(
  ctx: IProcessStreamContext | IProcessWebhookStreamContext,
): IConcurrentRequestLimiter {
  if (concurrentRequestLimiter === undefined) {
    concurrentRequestLimiter = ctx.getConcurrentRequestLimiter(
      4, // max 2 concurrent requests
      'github-concurrent-request-limiter',
    )
  }
  return concurrentRequestLimiter
}

export async function getGithubToken(ctx: IProcessStreamContext): Promise<string> {
  const auth = getAuth(ctx)
  if (auth) {
    const authResponse = await auth({
      type: 'installation',
      installationId: ctx.integration.identifier,
    })
    const token = authResponse.token
    // this is a real token, not a JWT token
    // OctoKit automatically caches it for 1 hour and renews it when needed
    return token
  }

  throw new Error('GitHub integration is not configured!')
}

async function getMemberData(ctx: IProcessStreamContext, login: string): Promise<any> {
  const appToken = await getGithubToken(ctx)
  return getMember(login, appToken)
}

async function getMemberEmail(ctx: IProcessStreamContext, login: string): Promise<string> {
  if (IS_TEST_ENV) {
    return ''
  }

  // here we use cache for tenantId-integrationType
  // So in LFX case different integration will have access to the same cache
  // But this is fine
  const cache = ctx.cache

  const existing = await cache.get(login)
  if (existing) {
    if (existing === 'null') {
      return ''
    }

    return existing
  }

  const member = await getMemberData(ctx, login)
  const email = (member && member.email ? member.email : '').trim()
  if (email && email.length > 0) {
    await cache.set(login, email, 60 * 60)
    return email
  }

  await cache.set(login, 'null', 60 * 60)
  return ''
}

const publishNextPageStream = async (
  ctx: IProcessStreamContext,
  response: GraphQlQueryResponse,
) => {
  const data = ctx.stream.data as GithubBasicStream
  // the last part of stream identifier is page number (e.g commits:12345:1)
  const streamIdentifier = ctx.stream.identifier.split(':').slice(0, -1).join(':')
  if (response.hasPreviousPage) {
    await ctx.publishStream<GithubBasicStream>(`${streamIdentifier}:${response.startCursor}`, {
      repo: data.repo,
      page: response.startCursor,
    })
  }
}

// this function extracts email and orgs from member data
export const prepareMember = async (
  memberFromApi: any,
  ctx: IProcessStreamContext,
): Promise<GithubPrepareMemberOutput> => {
  const email = await getMemberEmail(ctx, memberFromApi.login)

  let orgs: any

  if (memberFromApi?.company) {
    if (IS_TEST_ENV) {
      orgs = [{ name: 'crowd.dev' }]
    } else {
      const company = memberFromApi.company.replace('@', '').trim()
      const token = await getGithubToken(ctx)
      const fromAPI = await getOrganization(company, token)

      orgs = fromAPI
    }
  }

  return {
    email,
    orgs,
    memberFromApi,
  }
}

/**
 * Searches given repository name among installed repositories
 * Returns null if given repo is not found.
 * @param name  The tenant we are working on
 * @param context
 * @returns Found repo object
 */
function getRepoByName(name: string, ctx: IProcessStreamContext): Repo | null {
  const settings = ctx.integration.settings as GithubIntegrationSettings
  const availableRepo: Repo | undefined = singleOrDefault(settings.repos, (r) => r.name === name)
  if (availableRepo) {
    return { ...availableRepo, available: true }
  }

  const unavailableRepo: Repo | undefined = singleOrDefault(
    settings.unavailableRepos,
    (r) => r.name === name,
  )
  if (unavailableRepo) {
    return { ...unavailableRepo, available: false }
  }

  return null
}

const processRootStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubRootStream
  const repos: Repos = []
  const unavailableRepos: Repos = []

  for (const repo of data.reposToCheck) {
    try {
      // we don't need to get default 100 item per page, just 1 is enough to check if repo is available
      const stargazersQuery = new StargazersQuery(repo, await getGithubToken(ctx), 1)
      await stargazersQuery.getSinglePage('', {
        concurrentRequestLimiter: getConcurrentRequestLimiter(ctx),
        integrationId: ctx.integration.id,
      })
      repos.push(repo)
    } catch (e) {
      if (e.rateLimitResetSeconds) {
        throw e
      } else {
        ctx.log.warn(
          `Repo ${repo.name} will not be parsed. It is not available with the github token`,
        )
        unavailableRepos.push(repo)
      }
    }
  }

  // update integration settings
  // this settings will be avaliable in next streams
  await ctx.updateIntegrationSettings({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(ctx.integration.settings as any),
    repos,
    unavailableRepos,
  })

  // now it's time to start streams
  for (const repo of repos) {
    for (const endpoint of [
      GithubStreamType.STARGAZERS,
      GithubStreamType.FORKS,
      GithubStreamType.PULLS,
      GithubStreamType.ISSUES,
      GithubStreamType.DISCUSSIONS,
    ]) {
      // this firstPage thing is important to avoid duplicate streams and for handleNextPageStream to work
      await ctx.publishStream<GithubBasicStream>(`${endpoint}:${repo.name}:firstPage`, {
        repo,
        page: '',
      })
    }
  }
}

const processStargazersStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const stargazersQuery = new StargazersQuery(data.repo, await getGithubToken(ctx))
  const result = await stargazersQuery.getSinglePage(data.page, {
    concurrentRequestLimiter: getConcurrentRequestLimiter(ctx),
    integrationId: ctx.integration.id,
  })
  result.data = result.data.filter((i) => (i as any).node?.login)

  // handle next page
  await publishNextPageStream(ctx, result)

  for (const record of result.data) {
    const member = await prepareMember(record.node, ctx)

    // publish data
    await ctx.publishData<GithubApiData>({
      type: GithubActivityType.STAR,
      data: record,
      member,
      repo: data.repo,
    })
  }
}

const processForksStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const forksQuery = new ForksQuery(data.repo, await getGithubToken(ctx))
  const result = await forksQuery.getSinglePage(data.page, {
    concurrentRequestLimiter: getConcurrentRequestLimiter(ctx),
    integrationId: ctx.integration.id,
  })

  // filter out activities without authors (such as bots) -- may not the case for forks, but filter out anyway
  result.data = result.data.filter((i) => (i as any).owner?.login)

  // handle next page
  await publishNextPageStream(ctx, result)

  for (const record of result.data) {
    const member = await prepareMember(record.owner, ctx)

    // publish data
    await ctx.publishData<GithubApiData>({
      type: GithubActivityType.FORK,
      data: record,
      member,
      repo: data.repo,
    })
  }
}

const processPullsStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const forksQuery = new PullRequestsQuery(data.repo, await getGithubToken(ctx))
  const result = await forksQuery.getSinglePage(data.page, {
    concurrentRequestLimiter: getConcurrentRequestLimiter(ctx),
    integrationId: ctx.integration.id,
  })

  // filter out activities without authors (such as bots)
  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await publishNextPageStream(ctx, result)

  for (const pull of result.data) {
    const member = await prepareMember(pull.author, ctx)

    // publish data
    await ctx.publishData<GithubApiData>({
      type: GithubActivityType.PULL_REQUEST_OPENED,
      data: pull,
      member,
      repo: data.repo,
    })

    // now we need to parse pullRequestEvents
    for (const pullEvent of pull.timelineItems.nodes) {
      switch (pullEvent.__typename) {
        case GithubPullRequestEvents.ASSIGN: {
          if (pullEvent?.actor?.login && pullEvent?.assignee?.login) {
            const member = await prepareMember(pullEvent.actor, ctx)
            const objectMember = await prepareMember(pullEvent.assignee, ctx)

            await ctx.publishData<GithubApiData>({
              type: GithubActivityType.PULL_REQUEST_ASSIGNED,
              data: pullEvent,
              relatedData: pull,
              member,
              objectMember,
              repo: data.repo,
            })
          }
          break
        }
        case GithubPullRequestEvents.REQUEST_REVIEW: {
          if (
            pullEvent?.actor?.login &&
            (pullEvent?.requestedReviewer?.login || pullEvent?.requestedReviewer?.members)
          ) {
            // Requested review from single member
            if (pullEvent?.requestedReviewer?.login) {
              const member = await prepareMember(pullEvent.actor, ctx)
              const objectMember = await prepareMember(pullEvent.requestedReviewer, ctx)
              await ctx.publishData<GithubApiData>({
                type: GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED,
                data: pullEvent,
                subType: GithubActivitySubType.PULL_REQUEST_REVIEW_REQUESTED_SINGLE,
                relatedData: pull,
                member,
                objectMember,
                repo: data.repo,
              })
            } else if (pullEvent?.requestedReviewer?.members) {
              const member = await prepareMember(pullEvent.actor, ctx)

              for (const teamMember of pullEvent.requestedReviewer.members.nodes) {
                const objectMember = await prepareMember(teamMember, ctx)
                await ctx.publishData<GithubApiData>({
                  type: GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED,
                  data: pullEvent,
                  subType: GithubActivitySubType.PULL_REQUEST_REVIEW_REQUESTED_MULTIPLE,
                  relatedData: pull,
                  member,
                  objectMember,
                  repo: data.repo,
                })
              }
            }
          }
          break
        }
        case GithubPullRequestEvents.REVIEW: {
          if (pullEvent?.author?.login && pullEvent?.submittedAt) {
            const member = await prepareMember(pullEvent.author, ctx)
            await ctx.publishData<GithubApiData>({
              type: GithubActivityType.PULL_REQUEST_REVIEWED,
              data: pullEvent,
              relatedData: pull,
              member,
              repo: data.repo,
            })
          }
          break
        }
        case GithubPullRequestEvents.MERGE: {
          if (pullEvent?.actor?.login) {
            const member = await prepareMember(pullEvent.actor, ctx)
            await ctx.publishData<GithubApiData>({
              type: GithubActivityType.PULL_REQUEST_MERGED,
              data: pullEvent,
              relatedData: pull,
              member,
              repo: data.repo,
            })
          }
          break
        }
        case GithubPullRequestEvents.CLOSE: {
          if (pullEvent?.actor?.login) {
            const member = await prepareMember(pullEvent.actor, ctx)
            await ctx.publishData<GithubApiData>({
              type: GithubActivityType.PULL_REQUEST_MERGED,
              data: pullEvent,
              relatedData: pull,
              member,
              repo: data.repo,
            })
          }
          break
        }
        default:
          ctx.log.warn(
            `Unsupported pull request event:  ${pullEvent.__typename}. This event will not be parsed.`,
          )
      }
    }
  }

  const GITHUB_CONFIG = ctx.platformSettings as GithubPlatformSettings
  const IS_GITHUB_COMMIT_DATA_ENABLED = GITHUB_CONFIG.isCommitDataEnabled === 'true'

  if (IS_GITHUB_COMMIT_DATA_ENABLED) {
    // publish new pull commits streams
    // It is very important to keep commits first. Otherwise, we have problems
    // creating conversations if the Git integration has already ran for those data points.
    for (const pull of result.data) {
      await ctx.publishStream<GithubBasicStream>(
        `${GithubStreamType.PULL_COMMITS}:${pull.number}:firstPage`,
        {
          repo: data.repo,
          page: '',
          prNumber: pull.number,
        },
      )
    }
  }

  // publish new pull comments streams
  for (const pull of result.data) {
    await ctx.publishStream<GithubBasicStream>(
      `${GithubStreamType.PULL_COMMENTS}:${pull.number}:firstPage`,
      {
        repo: data.repo,
        page: '',
        prNumber: pull.number,
      },
    )
  }

  // publish new pull review threads streams
  for (const pull of result.data) {
    await ctx.publishStream<GithubBasicStream>(
      `${GithubStreamType.PULL_REVIEW_THREADS}:${pull.number}:firstPage`,
      {
        repo: data.repo,
        page: '',
        prNumber: pull.number,
      },
    )
  }
}

const processPullCommentsStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const pullRequestNumber = data.prNumber
  const pullRequestCommentsQuery = new PullRequestCommentsQuery(
    data.repo,
    pullRequestNumber,
    await getGithubToken(ctx),
  )

  const result = await pullRequestCommentsQuery.getSinglePage(data.page, {
    concurrentRequestLimiter: getConcurrentRequestLimiter(ctx),
    integrationId: ctx.integration.id,
  })
  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await publishNextPageStream(ctx, result)

  // get member info for each comment
  for (const record of result.data) {
    const member = await prepareMember(record.author, ctx)

    // publish data
    await ctx.publishData<GithubApiData>({
      type: GithubActivityType.PULL_REQUEST_COMMENT,
      data: record,
      member,
      repo: data.repo,
    })
  }
}

const processPullReviewThreadsStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const pullRequestNumber = data.prNumber
  const pullRequestReviewThreadsQuery = new PullRequestReviewThreadsQuery(
    data.repo,
    pullRequestNumber,
    await getGithubToken(ctx),
  )

  const result = await pullRequestReviewThreadsQuery.getSinglePage(data.page, {
    concurrentRequestLimiter: getConcurrentRequestLimiter(ctx),
    integrationId: ctx.integration.id,
  })

  // handle next page
  await publishNextPageStream(ctx, result)

  // no data to publish, just add new streams for comments inside
  // add each review thread as separate stream for comments inside
  for (const thread of result.data) {
    await ctx.publishStream<GithubBasicStream>(
      `${GithubStreamType.PULL_REVIEW_THREAD_COMMENTS}:${thread.id}:firstPage`,
      {
        repo: data.repo,
        page: '',
        reviewThreadId: thread.id,
      },
    )
  }
}

const processPullReviewThreadCommentsStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const reviewThreadId = data.reviewThreadId
  const pullRequestReviewThreadCommentsQuery = new PullRequestReviewThreadCommentsQuery(
    data.repo,
    reviewThreadId,
    await getGithubToken(ctx),
  )

  const result = await pullRequestReviewThreadCommentsQuery.getSinglePage(data.page, {
    concurrentRequestLimiter: getConcurrentRequestLimiter(ctx),
    integrationId: ctx.integration.id,
  })

  // filter out activities without authors (such as bots)
  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await publishNextPageStream(ctx, result)

  // get additional member info for each comment
  for (const record of result.data) {
    const member = await prepareMember(record.author, ctx)

    // publish data
    await ctx.publishData<GithubApiData>({
      type: GithubActivityType.PULL_REQUEST_REVIEW_THREAD_COMMENT,
      data: record,
      member,
      repo: data.repo,
    })
  }
}

export const processPullCommitsStream: ProcessStreamHandler = async (ctx) => {
  let result: GraphQlQueryResponse

  const data = ctx.stream.data as GithubBasicStream
  const pullRequestNumber = data.prNumber

  const token = await getGithubToken(ctx)

  const pullRequestCommitsQuery = new PullRequestCommitsQuery(data.repo, pullRequestNumber, token)

  try {
    result = await pullRequestCommitsQuery.getSinglePage(data.page, {
      concurrentRequestLimiter: getConcurrentRequestLimiter(ctx),
      integrationId: ctx.integration.id,
    })
  } catch (err) {
    ctx.log.warn(
      {
        err,
        repo: data.repo,
        pullRequestNumber,
      },
      'Error while fetching pull request commits. Trying again without additions.',
    )
    const pullRequestCommitsQueryNoAdditions = new PullRequestCommitsQueryNoAdditions(
      data.repo,
      pullRequestNumber,
      await getGithubToken(ctx),
    )
    result = await pullRequestCommitsQueryNoAdditions.getSinglePage(data.page, {
      concurrentRequestLimiter: getConcurrentRequestLimiter(ctx),
      integrationId: ctx.integration.id,
    })
  }

  // handle next page
  await publishNextPageStream(ctx, result)

  // getting additional member info for each commit
  {
    const response = result.data[0] as PullRequestCommit | PullRequestCommitNoAdditions
    const commits = response.repository.pullRequest.commits.nodes

    for (const record of commits) {
      for (const author of record.commit.authors.nodes) {
        if (!author || !author?.user || !author?.user?.login) {
          // eslint-disable-next-line no-continue
          continue
        }
        const member = await prepareMember(author.user, ctx)

        // publish data
        await ctx.publishData<GithubApiData>({
          type: GithubActivityType.AUTHORED_COMMIT,
          data: record,
          sourceParentId: response.repository.pullRequest.id,
          member,
          repo: data.repo,
        })
      }
    }
  }
}

const processIssuesStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const issuesQuery = new IssuesQuery(data.repo, await getGithubToken(ctx))
  const result = await issuesQuery.getSinglePage(data.page, {
    concurrentRequestLimiter: getConcurrentRequestLimiter(ctx),
    integrationId: ctx.integration.id,
  })

  // filter out activities without authors (such as bots)
  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await publishNextPageStream(ctx, result)

  for (const issue of result.data) {
    const member = await prepareMember(issue.author, ctx)

    await ctx.publishData<GithubApiData>({
      type: GithubActivityType.ISSUE_OPENED,
      data: issue,
      member,
      repo: data.repo,
    })

    // now need to parse issue events
    for (const issueEvent of issue.timelineItems.nodes) {
      switch (issueEvent.__typename) {
        case GithubPullRequestEvents.CLOSE: {
          if (issueEvent?.actor?.login) {
            const member = await prepareMember(issueEvent.actor, ctx)
            await ctx.publishData<GithubApiData>({
              type: GithubActivityType.ISSUE_CLOSED,
              data: issueEvent,
              relatedData: issue,
              member,
              repo: data.repo,
            })
          }
          break
        }
        default:
          ctx.log.warn(
            `Unsupported issue event:  ${issueEvent.__typename}. This event will not be parsed.`,
          )
      }
    }
  }

  // add each issue as separate stream for comments inside
  for (const issue of result.data) {
    await ctx.publishStream<GithubBasicStream>(
      `${GithubStreamType.ISSUE_COMMENTS}:${issue.number}:firstPage`,
      {
        repo: data.repo,
        page: '',
        issueNumber: issue.number,
      },
    )
  }
}

const processIssueCommentsStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const issueNumber = data.issueNumber
  const issueCommentsQuery = new IssueCommentsQuery(
    data.repo,
    issueNumber,
    await getGithubToken(ctx),
  )
  const result = await issueCommentsQuery.getSinglePage(data.page, {
    concurrentRequestLimiter: getConcurrentRequestLimiter(ctx),
    integrationId: ctx.integration.id,
  })
  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await publishNextPageStream(ctx, result)

  // get additional member info for each comment
  for (const record of result.data) {
    const member = await prepareMember(record.author, ctx)

    // publish data
    await ctx.publishData<GithubApiData>({
      type: GithubActivityType.ISSUE_COMMENT,
      data: record,
      member,
      repo: data.repo,
    })
  }
}

const processDiscussionsStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const discussionsQuery = new DiscussionsQuery(data.repo, await getGithubToken(ctx))
  const result = await discussionsQuery.getSinglePage(data.page, {
    concurrentRequestLimiter: getConcurrentRequestLimiter(ctx),
    integrationId: ctx.integration.id,
  })

  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await publishNextPageStream(ctx, result)

  // get additional member info for each comment
  for (const discussion of result.data) {
    const member = await prepareMember(discussion.author, ctx)

    // publish data
    await ctx.publishData<GithubApiData>({
      type: GithubActivityType.DISCUSSION_STARTED,
      data: discussion,
      member,
      repo: data.repo,
    })
  }

  // add each discussion as separate stream for comments inside
  for (const d of result.data.filter((d) => d.comments.totalCount > 0)) {
    await ctx.publishStream<GithubBasicStream>(
      `${GithubStreamType.DISCUSSION_COMMENTS}:${d.id}:firstPage`,
      {
        repo: data.repo,
        page: '',
        discussionNumber: d.number,
      },
    )
  }
}

const processDiscussionCommentsStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const discussionCommentsQuery = new DiscussionCommentsQuery(
    data.repo,
    data.discussionNumber,
    await getGithubToken(ctx),
  )
  const result = await discussionCommentsQuery.getSinglePage(data.page, {
    concurrentRequestLimiter: getConcurrentRequestLimiter(ctx),
    integrationId: ctx.integration.id,
  })
  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await publishNextPageStream(ctx, result)

  for (const record of result.data) {
    if (!('author' in record)) {
      // eslint-disable-next-line no-continue
      continue
    }

    const commentId = record.id
    const member = await prepareMember(record.author, ctx)

    // publish data
    await ctx.publishData<GithubApiData>({
      type: GithubActivityType.DISCUSSION_COMMENT,
      subType: GithubActivitySubType.DISCUSSION_COMMENT_START,
      data: record,
      member,
      repo: data.repo,
    })

    // going through replies
    for (const reply of record.replies.nodes) {
      if (!('author' in reply) || !reply?.author || !reply?.author?.login) {
        // eslint-disable-next-line no-continue
        continue
      }
      const member = await prepareMember(reply.author, ctx)

      // publish data
      await ctx.publishData<GithubApiData>({
        type: GithubActivityType.DISCUSSION_COMMENT,
        subType: GithubActivitySubType.DISCUSSION_COMMENT_REPLY,
        data: reply,
        member,
        sourceParentId: commentId,
        repo: data.repo,
      })
    }
  }
}

const handler: ProcessStreamHandler = async (ctx) => {
  await timeout(1000)
  const streamIdentifier = ctx.stream.identifier
  if (streamIdentifier.startsWith(GithubStreamType.ROOT)) {
    await processRootStream(ctx)
  } else {
    const data = ctx.stream.data as GithubBasicStream
    const repo = getRepoByName(data.repo.name, ctx)

    if (repo === null) {
      await ctx.abortWithError(
        `Stream ${ctx.stream.identifier} can't be processed since repo ${data.repo.name} is not found!`,
        {
          repoName: data.repo.name,
          streamIdentifier: ctx.stream.identifier,
        },
      )
    }

    if (!repo.available) {
      await ctx.abortWithError(
        `Stream ${ctx.stream.identifier} can't be processed since repo ${data.repo.name} is not available!`,
        {
          repoName: data.repo.name,
          streamIdentifier: ctx.stream.identifier,
        },
      )
    }

    // if all checks are passed, we can start processing

    // Extract the stream type from the identifier
    const streamType = streamIdentifier.split(':')[0]

    switch (streamType) {
      case GithubStreamType.STARGAZERS:
        await processStargazersStream(ctx)
        break
      case GithubStreamType.FORKS:
        await processForksStream(ctx)
        break
      case GithubStreamType.PULLS:
        await processPullsStream(ctx)
        break
      case GithubStreamType.PULL_COMMENTS:
        await processPullCommentsStream(ctx)
        break
      case GithubStreamType.PULL_REVIEW_THREADS:
        await processPullReviewThreadsStream(ctx)
        break
      case GithubStreamType.PULL_REVIEW_THREAD_COMMENTS:
        await processPullReviewThreadCommentsStream(ctx)
        break
      case GithubStreamType.PULL_COMMITS:
        await processPullCommitsStream(ctx)
        break
      case GithubStreamType.ISSUES:
        await processIssuesStream(ctx)
        break
      case GithubStreamType.ISSUE_COMMENTS:
        await processIssueCommentsStream(ctx)
        break
      case GithubStreamType.DISCUSSIONS:
        await processDiscussionsStream(ctx)
        break
      case GithubStreamType.DISCUSSION_COMMENTS:
        await processDiscussionCommentsStream(ctx)
        break
      default:
        console.error(`No matching process function for streamType: ${streamType}`)
    }
  }
}

export default handler
