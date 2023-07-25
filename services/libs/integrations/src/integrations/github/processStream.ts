/* eslint-disable  @typescript-eslint/no-explicit-any */
// processStream.ts content
import { IProcessStreamContext, ProcessStreamHandler } from '../../types'
import {
  GithubStreamType,
  GithubRootStream,
  Repos,
  GithubBasicStream,
  Repo,
  GithubIntegrationSettings,
  GithubApiData,
  AppTokenResponse,
  GithubPlatformSettings,
  GithubPrepareMemberOutput,
  GithubPullRequestEvents,
  GithubActivityType,
  GithubActivitySubType,
} from './types'
import StargazersQuery from './api/graphql/stargazers'
import ForksQuery from './api/graphql/forks'
import PullRequestsQuery from './api/graphql/pullRequests'
import PullRequestCommentsQuery from './api/graphql/pullRequestComments'
import PullRequestCommitsQuery, { PullRequestCommit } from './api/graphql/pullRequestCommits'
import PullRequestReviewThreadsQuery from './api/graphql/pullRequestReviewThreads'
import PullRequestReviewThreadCommentsQuery from './api/graphql/pullRequestReviewThreadComments'
import PullRequestCommitsQueryNoAdditions, {
  PullRequestCommitNoAdditions,
} from './api/graphql/pullRequestCommitsNoAdditions'
import IssuesQuery from './api/graphql/issues'
import IssueCommentsQuery from './api/graphql/issueComments'
import DiscussionsQuery from './api/graphql/discussions'
import DiscussionCommentsQuery from './api/graphql/discussionComments'
import { singleOrDefault } from '@crowd/common'
import { timeout } from '@crowd/common'
import { GraphQlQueryResponse } from '@crowd/types'
import getOrganization from './api/graphql/organizations'
import getMember from './api/graphql/members'
import { getAppToken } from './api/rest/getAppToken'
import { createAppAuth } from '@octokit/auth-app'
import { AuthInterface } from '@octokit/auth-app/dist-types/types'

const IS_TEST_ENV: boolean = process.env.NODE_ENV === 'test'

let githubAuthenticator: AuthInterface | undefined = undefined

function getAuth(ctx: IProcessStreamContext): AuthInterface | undefined {
  const GITHUB_CONFIG = ctx.platformSettings as GithubPlatformSettings
  console.log('GITHUB_CONFIG', GITHUB_CONFIG)
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

const getTokenFromCache = async (ctx: IProcessStreamContext) => {
  const key = 'github-token-cache'
  const cache = ctx.cache

  const token = await cache.get(key)

  if (token) {
    return JSON.parse(token)
  } else {
    return null
  }
}

const setTokenToCache = async (ctx: IProcessStreamContext, token: AppTokenResponse) => {
  const key = 'github-token-cache'
  const cache = ctx.cache

  // cache for 5 minutes
  await cache.set(key, JSON.stringify(token), 5 * 60)
}

async function getGithubToken(ctx: IProcessStreamContext): Promise<string> {
  const auth = getAuth(ctx)
  if (auth) {
    let appToken: AppTokenResponse
    const tokenFromCache = await getTokenFromCache(ctx)
    if (tokenFromCache) {
      appToken = tokenFromCache
    } else {
      // no token or it expired (more 5 minutes)
      const authResponse = await auth({ type: 'app' })
      const jwtToken = authResponse.token
      appToken = await getAppToken(jwtToken, ctx.integration.identifier)
    }

    setTokenToCache(ctx, appToken)

    return appToken.token
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

const handleNextPageStream = async (ctx: IProcessStreamContext, response: GraphQlQueryResponse) => {
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
      const fromAPI = await getOrganization(company, ctx.integration.token)

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
      const stargazersQuery = new StargazersQuery(repo, ctx.integration.token, 1)
      await stargazersQuery.getSinglePage('')
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
      await ctx.publishStream<GithubBasicStream>(`${endpoint}:firstPage`, {
        repo,
        page: '',
      })
    }
  }
}

const processStargazersStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const stargazersQuery = new StargazersQuery(data.repo, ctx.integration.token)
  const result = await stargazersQuery.getSinglePage(data.page)
  result.data = result.data.filter((i) => (i as any).node?.login)

  // handle next page
  await handleNextPageStream(ctx, result)

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
  const forksQuery = new ForksQuery(data.repo, ctx.integration.token)
  const result = await forksQuery.getSinglePage(data.page)

  // filter out activities without authors (such as bots) -- may not the case for forks, but filter out anyway
  result.data = result.data.filter((i) => (i as any).owner?.login)

  // handle next page
  await handleNextPageStream(ctx, result)

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
  const forksQuery = new PullRequestsQuery(data.repo, ctx.integration.token)
  const result = await forksQuery.getSinglePage(data.page)

  // filter out activities without authors (such as bots)
  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await handleNextPageStream(ctx, result)

  for (const record1 of result.data) {
    const member = await prepareMember(record1.author, ctx)

    // publish data
    await ctx.publishData<GithubApiData>({
      type: GithubActivityType.PULL_REQUEST_OPENED,
      data: record1,
      member,
      repo: data.repo,
    })

    // now we need to parse pullRequestEvents
    for (const record2 of record1.timelineItems.nodes) {
      switch (record2.__typename) {
        case GithubPullRequestEvents.ASSIGN: {
          if (record2?.actor?.login && record2?.assignee?.login) {
            const member = await prepareMember(record2.actor, ctx)
            const objectMember = await prepareMember(record2.assignee, ctx)

            await ctx.publishData<GithubApiData>({
              type: GithubActivityType.PULL_REQUEST_ASSIGNED,
              data: record2,
              relatedData: record1,
              member,
              objectMember,
              repo: data.repo,
            })
          }
          break
        }
        case GithubPullRequestEvents.REQUEST_REVIEW: {
          if (
            record2?.actor?.login &&
            (record2?.requestedReviewer?.login || record2?.requestedReviewer?.members)
          ) {
            // Requested review from single member
            if (record2?.requestedReviewer?.login) {
              const member = await prepareMember(record2.actor, ctx)
              const objectMember = await prepareMember(record2.requestedReviewer, ctx)
              await ctx.publishData<GithubApiData>({
                type: GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED,
                data: record2,
                subType: GithubActivitySubType.PULL_REQUEST_REVIEW_REQUESTED_SINGLE,
                relatedData: record1,
                member,
                objectMember,
                repo: data.repo,
              })
            } else if (record2?.requestedReviewer?.members) {
              const member = await prepareMember(record2.actor, ctx)

              for (const teamMember of record2.requestedReviewer.members.nodes) {
                const objectMember = await prepareMember(teamMember, ctx)
                await ctx.publishData<GithubApiData>({
                  type: GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED,
                  data: record2,
                  subType: GithubActivitySubType.PULL_REQUEST_REVIEW_REQUESTED_MULTIPLE,
                  relatedData: record1,
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
          if (record2?.author?.login && record2?.submittedAt) {
            const member = await prepareMember(record2.author, ctx)
            await ctx.publishData<GithubApiData>({
              type: GithubActivityType.PULL_REQUEST_REVIEWED,
              data: record2,
              relatedData: record1,
              member,
              repo: data.repo,
            })
          }
          break
        }
        case GithubPullRequestEvents.MERGE: {
          if (record2?.actor?.login) {
            const member = await prepareMember(record2.actor, ctx)
            await ctx.publishData<GithubApiData>({
              type: GithubActivityType.PULL_REQUEST_MERGED,
              data: record2,
              relatedData: record1,
              member,
              repo: data.repo,
            })
          }
          break
        }
        case GithubPullRequestEvents.CLOSE: {
          if (record2?.actor?.login) {
            const member = await prepareMember(record2.actor, ctx)
            await ctx.publishData<GithubApiData>({
              type: GithubActivityType.PULL_REQUEST_MERGED,
              data: record2,
              relatedData: record1,
              member,
              repo: data.repo,
            })
          }
          break
        }
        default:
          ctx.log.warn(
            `Unsupported pull request event:  ${record2.__typename}. This event will not be parsed.`,
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
    ctx.integration.token,
  )

  const result = await pullRequestCommentsQuery.getSinglePage(data.page)
  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await handleNextPageStream(ctx, result)

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
    ctx.integration.token,
  )

  const result = await pullRequestReviewThreadsQuery.getSinglePage(data.page)

  // handle next page
  await handleNextPageStream(ctx, result)

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
    ctx.integration.token,
  )

  const result = await pullRequestReviewThreadCommentsQuery.getSinglePage(data.page)

  // filter out activities without authors (such as bots)
  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await handleNextPageStream(ctx, result)

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
  const pullRequestCommitsQuery = new PullRequestCommitsQuery(
    data.repo,
    pullRequestNumber,
    ctx.integration.token,
  )

  try {
    result = await pullRequestCommitsQuery.getSinglePage(data.page)
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
      ctx.integration.token,
    )
    result = await pullRequestCommitsQueryNoAdditions.getSinglePage(data.page)
  }

  // handle next page
  await handleNextPageStream(ctx, result)

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
          member,
          repo: data.repo,
        })
      }
    }
  }
}

const processIssuesStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const issuesQuery = new IssuesQuery(data.repo, ctx.integration.token)
  const result = await issuesQuery.getSinglePage(data.page)

  // filter out activities without authors (such as bots)
  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await handleNextPageStream(ctx, result)

  for (const record1 of result.data) {
    const member = await prepareMember(record1.author, ctx)

    await ctx.publishData<GithubApiData>({
      type: GithubActivityType.ISSUE_OPENED,
      data: record1,
      member,
      repo: data.repo,
    })

    // now need to parse issue events
    for (const record2 of record1.timelineItems.nodes) {
      switch (record2.__typename) {
        case GithubPullRequestEvents.CLOSE: {
          if (record2?.actor?.login) {
            const member = await prepareMember(record2.actor, ctx)
            await ctx.publishData<GithubApiData>({
              type: GithubActivityType.ISSUE_CLOSED,
              data: record2,
              relatedData: record1,
              member,
              repo: data.repo,
            })
          }
          break
        }
        default:
          ctx.log.warn(
            `Unsupported issue event:  ${record2.__typename}. This event will not be parsed.`,
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
  const issueCommentsQuery = new IssueCommentsQuery(data.repo, issueNumber, ctx.integration.token)
  const result = await issueCommentsQuery.getSinglePage(data.page)
  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await handleNextPageStream(ctx, result)

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
  const discussionsQuery = new DiscussionsQuery(data.repo, ctx.integration.token)
  const result = await discussionsQuery.getSinglePage(data.page)

  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await handleNextPageStream(ctx, result)

  // get additional member info for each comment
  for (const d of result.data) {
    const member = await prepareMember(d.author, ctx)

    // publish data
    await ctx.publishData<GithubApiData>({
      type: GithubActivityType.DISCUSSION_STARTED,
      data: d,
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
    ctx.integration.token,
  )
  const result = await discussionCommentsQuery.getSinglePage(data.page)
  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await handleNextPageStream(ctx, result)

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

    if (streamIdentifier.startsWith(GithubStreamType.STARGAZERS)) {
      await processStargazersStream(ctx)
    } else if (streamIdentifier.startsWith(GithubStreamType.FORKS)) {
      await processForksStream(ctx)
    } else if (streamIdentifier.startsWith(GithubStreamType.PULLS)) {
      await processPullsStream(ctx)
    } else if (streamIdentifier.startsWith(GithubStreamType.PULL_COMMENTS)) {
      await processPullCommentsStream(ctx)
    } else if (streamIdentifier.startsWith(GithubStreamType.PULL_REVIEW_THREADS)) {
      await processPullReviewThreadsStream(ctx)
    } else if (streamIdentifier.startsWith(GithubStreamType.PULL_REVIEW_THREAD_COMMENTS)) {
      await processPullReviewThreadCommentsStream(ctx)
    } else if (streamIdentifier.startsWith(GithubStreamType.PULL_COMMITS)) {
      await processPullCommitsStream(ctx)
    } else if (streamIdentifier.startsWith(GithubStreamType.ISSUES)) {
      await processIssuesStream(ctx)
    } else if (streamIdentifier.startsWith(GithubStreamType.ISSUE_COMMENTS)) {
      await processIssueCommentsStream(ctx)
    } else if (streamIdentifier.startsWith(GithubStreamType.DISCUSSIONS)) {
      await processDiscussionsStream(ctx)
    } else if (streamIdentifier.startsWith(GithubStreamType.DISCUSSION_COMMENTS)) {
      await processDiscussionCommentsStream(ctx)
    }
  }
}

export default handler
