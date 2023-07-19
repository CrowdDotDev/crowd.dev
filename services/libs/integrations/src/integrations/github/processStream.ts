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
  GithubApiDataType,
} from './types'
import StargazersQuery from './api/graphql/stargazers'
import ForksQuery from './api/graphql/forks'
import PullRequestsQuery from './api/graphql/pullRequests'
import PullRequestCommentsQuery from './api/graphql/pullRequestComments'
import PullRequestCommitsQuery from './api/graphql/pullRequestCommits'
import PullRequestReviewThreadsQuery from './api/graphql/pullRequestReviewThreads'
import PullRequestReviewThreadCommentsQuery from './api/graphql/pullRequestReviewThreadComments'
import PullRequestCommitsQueryNoAdditions from './api/graphql/pullRequestCommitsNoAdditions'
import IssuesQuery from './api/graphql/issues'
import IssueCommentsQuery from './api/graphql/issueComments'
import DiscussionsQuery from './api/graphql/discussions'
import DiscussionCommentsQuery from './api/graphql/discussionComments'
import { singleOrDefault } from '@crowd/common'
import { timeout } from '@crowd/common'
import { GraphQlQueryResponse } from '@crowd/types'

const handleNextPageStream = async (ctx: IProcessStreamContext, response: GraphQlQueryResponse) => {
  const data = ctx.stream.data as GithubBasicStream
  const streamIdentifier = ctx.stream.identifier.split(':').slice(0, -1).join(':')
  if (response.hasPreviousPage) {
    await ctx.publishStream<GithubBasicStream>(`${streamIdentifier}:${response.startCursor}`, {
      repo: data.repo,
      page: response.startCursor,
      isCommitDataEnabled: data.isCommitDataEnabled,
      privateKey: data.privateKey,
    })
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
        isCommitDataEnabled: data.isCommitDataEnabled,
        privateKey: data.privateKey,
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

  // publish stargazers
  await ctx.publishData<GithubApiData>({
    type: GithubApiDataType.STARGAZERS,
    data: result.data,
  })
}

const processForksStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const forksQuery = new ForksQuery(data.repo, ctx.integration.token)
  const result = await forksQuery.getSinglePage(data.page)

  // filter out activities without authors (such as bots) -- may not the case for forks, but filter out anyway
  result.data = result.data.filter((i) => (i as any).owner?.login)

  // handle next page
  await handleNextPageStream(ctx, result)

  // publish data
  await ctx.publishData<GithubApiData>({
    type: GithubApiDataType.FORKS,
    data: result.data,
  })
}

const processPullsStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const forksQuery = new PullRequestsQuery(data.repo, ctx.integration.token)
  const result = await forksQuery.getSinglePage(data.page)

  // filter out activities without authors (such as bots)
  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await handleNextPageStream(ctx, result)

  // publish data
  await ctx.publishData<GithubApiData>({
    type: GithubApiDataType.PULLS,
    data: result.data,
  })

  if (data.isCommitDataEnabled) {
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
          isCommitDataEnabled: data.isCommitDataEnabled,
          privateKey: data.privateKey,
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
        isCommitDataEnabled: data.isCommitDataEnabled,
        privateKey: data.privateKey,
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
        isCommitDataEnabled: data.isCommitDataEnabled,
        privateKey: data.privateKey,
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

  // publish data
  await ctx.publishData<GithubApiData>({
    type: GithubApiDataType.PULL_COMMENTS,
    data: result.data,
  })
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

  // publish data
  await ctx.publishData<GithubApiData>({
    type: GithubApiDataType.PULL_REVIEW_THREADS,
    data: result.data,
  })

  // add each review thread as separate stream for comments inside
  for (const thread of result.data) {
    await ctx.publishStream<GithubBasicStream>(
      `${GithubStreamType.PULL_REVIEW_THREAD_COMMENTS}:${thread.id}:firstPage`,
      {
        repo: data.repo,
        page: '',
        reviewThreadId: thread.id,
        isCommitDataEnabled: data.isCommitDataEnabled,
        privateKey: data.privateKey,
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

  // publish data
  await ctx.publishData<GithubApiData>({
    type: GithubApiDataType.PULL_REVIEW_THREAD_COMMENTS,
    data: result.data,
  })
}

const processPullCommitsStream: ProcessStreamHandler = async (ctx) => {
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

  // publish data
  await ctx.publishData<GithubApiData>({
    type: GithubApiDataType.PULL_COMMITS,
    data: result.data,
  })
}

const processIssuesStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const issuesQuery = new IssuesQuery(data.repo, ctx.integration.token)
  const result = await issuesQuery.getSinglePage(data.page)

  // filter out activities without authors (such as bots)
  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await handleNextPageStream(ctx, result)

  // publish data
  await ctx.publishData<GithubApiData>({
    type: GithubApiDataType.ISSUES,
    data: result.data,
  })

  // add each issue as separate stream for comments inside
  for (const issue of result.data) {
    await ctx.publishStream<GithubBasicStream>(
      `${GithubStreamType.ISSUE_COMMENTS}:${issue.number}:firstPage`,
      {
        repo: data.repo,
        page: '',
        issueNumber: issue.number,
        isCommitDataEnabled: data.isCommitDataEnabled,
        privateKey: data.privateKey,
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

  // publish data
  await ctx.publishData<GithubApiData>({
    type: GithubApiDataType.ISSUE_COMMENTS,
    data: result.data,
  })
}

const processDiscussionsStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const discussionsQuery = new DiscussionsQuery(data.repo, ctx.integration.token)
  const result = await discussionsQuery.getSinglePage(data.page)

  result.data = result.data.filter((i) => (i as any).author?.login)

  // handle next page
  await handleNextPageStream(ctx, result)

  // publish data
  await ctx.publishData<GithubApiData>({
    type: GithubApiDataType.DISCUSSIONS,
    data: result.data,
  })

  for (const d of result.data.filter((d) => d.comments.totalCount > 0)) {
    await ctx.publishStream<GithubBasicStream>(
      `${GithubStreamType.DISCUSSION_COMMENTS}:${d.id}:firstPage`,
      {
        repo: data.repo,
        page: '',
        discussionNumber: d.number,
        isCommitDataEnabled: data.isCommitDataEnabled,
        privateKey: data.privateKey,
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

  // publish data
  await ctx.publishData<GithubApiData>({
    type: GithubApiDataType.DISCUSSION_COMMENTS,
    data: result.data,
  })
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
