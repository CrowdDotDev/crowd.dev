// processStream.ts content
import {
  GithubSnowflakeClient,
  IBasicResponse,
  IGetResponse,
  SnowflakeClient,
} from '@crowd/snowflake'

import { IProcessStreamContext, ProcessStreamHandler } from '../../types'

import { capGithubArchive } from './cap'
import {
  GithubActivityType,
  GithubApiData,
  GithubBasicStream,
  GithubPlatformSettings,
  GithubPrepareMemberOutput,
  GithubRootStream,
  GithubStreamType,
} from './types'

let sf: SnowflakeClient | undefined = undefined
let gh: GithubSnowflakeClient | undefined = undefined

let sfIncremental: SnowflakeClient | undefined = undefined
let ghIncremental: GithubSnowflakeClient | undefined = undefined

const initClient = (ctx: IProcessStreamContext) => {
  const settings = ctx.platformSettings as GithubPlatformSettings
  sf = new SnowflakeClient({
    privateKeyString: settings.sfPrivateKey,
    account: settings.sfAccount,
    username: settings.sfUsername,
    database: settings.sfDatabase,
    warehouse: settings.sfWarehouse,
    role: settings.sfRole,
    parentLog: ctx.log,
  })
  gh = new GithubSnowflakeClient(sf)
}

const initIncrementalClient = (ctx: IProcessStreamContext) => {
  const settings = ctx.platformSettings as GithubPlatformSettings
  sfIncremental = new SnowflakeClient({
    privateKeyString: settings.sfPrivateKey,
    account: settings.sfAccount,
    username: settings.sfUsername,
    database: settings.sfDatabase,
    warehouse: settings.sfIncrementalWarehouse,
    role: settings.sfRole,
    parentLog: ctx.log,
  })
  ghIncremental = new GithubSnowflakeClient(sfIncremental)
}

const getClient = (
  ctx: IProcessStreamContext,
): { sf: SnowflakeClient; gh: GithubSnowflakeClient } => {
  if (ctx.onboarding) {
    if (!sf) {
      initClient(ctx)
    }
    return { sf, gh }
  } else {
    if (!sfIncremental) {
      initIncrementalClient(ctx)
    }
    return { sf: sfIncremental, gh: ghIncremental }
  }
}

const prepareMember = (data: IBasicResponse): GithubPrepareMemberOutput => {
  const isBot = data.actorLogin.endsWith('[bot]')
  return {
    memberFromApi: {
      id: data.actorId.toString(),
      login: data.actorLogin,
      avatarUrl: data.actorAvatarUrl,
      ...(isBot ? { isBot: true } : {}),
    },
    org: {
      id: data.orgId?.toString(),
      login: data.orgLogin,
      avatarUrl: data.orgAvatarUrl,
    },
    email: '',
  }
}

const publishNextPageStream = async (ctx: IProcessStreamContext, response: IGetResponse) => {
  const data = ctx.stream.data as GithubBasicStream
  // the last part of stream identifier is page number (e.g commits:12345:1)
  const streamIdentifier = ctx.stream.identifier.split(':').slice(0, -1).join(':')
  if (response.hasNextPage) {
    await ctx.publishStream<GithubBasicStream>(`${streamIdentifier}:${response.nextPage}`, {
      repo: data.repo,
      sf_repo_id: data.sf_repo_id,
      page: response.nextPage,
    })
    return true
  }
  return false
}

const processStargazersStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const { gh } = getClient(ctx)

  const since_days_ago = ctx.onboarding ? undefined : '2'

  const result = await gh.getRepoStargazers({
    sf_repo_id: data.sf_repo_id,
    page: data.page,
    since_days_ago,
  })

  for (const record of result.data) {
    const member = prepareMember(record)

    // publish data
    await ctx.processData<GithubApiData>({
      type: GithubActivityType.STAR,
      data: record,
      member,
      repo: data.repo,
    })
  }

  await publishNextPageStream(ctx, result)
}

const processForksStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const { gh } = getClient(ctx)

  const since_days_ago = ctx.onboarding ? undefined : '2'

  const result = await gh.getRepoForks({
    sf_repo_id: data.sf_repo_id,
    page: data.page,
    since_days_ago,
  })

  for (const record of result.data) {
    const member = prepareMember(record)

    // publish data
    await ctx.processData<GithubApiData>({
      type: GithubActivityType.FORK,
      data: record,
      member,
      repo: data.repo,
    })
  }

  await publishNextPageStream(ctx, result)
}

const processPullsStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const { gh } = getClient(ctx)

  const since_days_ago = ctx.onboarding ? undefined : '2'

  const result = await gh.getRepoPullRequests({
    sf_repo_id: data.sf_repo_id,
    page: data.page,
    since_days_ago,
  })

  for (const record of result.data) {
    const member = prepareMember(record)
    const action = record.action

    if (action === 'opened') {
      await ctx.processData<GithubApiData>({
        type: GithubActivityType.PULL_REQUEST_OPENED,
        data: record,
        member,
        repo: data.repo,
      })
    } else if (action === 'closed') {
      await ctx.processData<GithubApiData>({
        type: GithubActivityType.PULL_REQUEST_CLOSED,
        data: record,
        member,
        repo: data.repo,
      })

      // additionall check if this PR is merged
      if (record.payload.pull_request.merged) {
        await ctx.processData<GithubApiData>({
          type: GithubActivityType.PULL_REQUEST_MERGED,
          data: record,
          member,
          repo: data.repo,
        })
      }
    } else {
      ctx.log.debug(`Unsupported pull request action: ${action}`)
    }
  }

  await publishNextPageStream(ctx, result)
}

const processPullCommentsStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const { gh } = getClient(ctx)

  const since_days_ago = ctx.onboarding ? undefined : '2'

  const result = await gh.getRepoPullRequestReviewComments({
    sf_repo_id: data.sf_repo_id,
    page: data.page,
    since_days_ago,
  })

  for (const record of result.data) {
    const member = prepareMember(record)

    await ctx.processData<GithubApiData>({
      type: GithubActivityType.PULL_REQUEST_COMMENT,
      data: record,
      member,
      repo: data.repo,
    })
  }

  await publishNextPageStream(ctx, result)
}

const processIssuesStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const { gh } = getClient(ctx)

  const since_days_ago = ctx.onboarding ? undefined : '2'

  const result = await gh.getRepoIssues({
    sf_repo_id: data.sf_repo_id,
    page: data.page,
    since_days_ago,
  })

  for (const record of result.data) {
    const member = prepareMember(record)

    const action = record.action

    if (action === 'opened') {
      await ctx.processData<GithubApiData>({
        type: GithubActivityType.ISSUE_OPENED,
        data: record,
        member,
        repo: data.repo,
      })
    } else if (action === 'closed') {
      await ctx.processData<GithubApiData>({
        type: GithubActivityType.ISSUE_CLOSED,
        data: record,
        member,
        repo: data.repo,
      })
    }
  }

  await publishNextPageStream(ctx, result)
}

const processIssueCommentsStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const { gh } = getClient(ctx)

  const since_days_ago = ctx.onboarding ? undefined : '2'

  const result = await gh.getRepoIssueComments({
    sf_repo_id: data.sf_repo_id,
    page: data.page,
    since_days_ago,
  })

  for (const record of result.data) {
    const member = prepareMember(record)

    await ctx.processData<GithubApiData>({
      type: GithubActivityType.ISSUE_COMMENT,
      data: record,
      member,
      repo: data.repo,
    })
  }

  await publishNextPageStream(ctx, result)
}

const processPullCommitsStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const { gh } = getClient(ctx)

  const since_days_ago = ctx.onboarding ? undefined : '2'

  const result = await gh.getRepoPushes({
    sf_repo_id: data.sf_repo_id,
    page: data.page,
    since_days_ago,
  })

  for (const record of result.data) {
    const member = prepareMember(record)

    await ctx.processData<GithubApiData>({
      type: GithubActivityType.AUTHORED_COMMIT,
      data: record,
      member,
      repo: data.repo,
    })
  }

  await publishNextPageStream(ctx, result)
}

const processPullReviewsStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const { gh } = getClient(ctx)

  const since_days_ago = ctx.onboarding ? undefined : '2'

  const result = await gh.getRepoPullRequestReviews({
    sf_repo_id: data.sf_repo_id,
    page: data.page,
    since_days_ago,
  })

  for (const record of result.data) {
    const member = prepareMember(record)

    // ignore commented reviews with no body
    if (record.payload.review.state === 'commented' && record.payload.review.body === null) {
      continue
    }

    await ctx.processData<GithubApiData>({
      type: GithubActivityType.PULL_REQUEST_REVIEWED,
      data: record,
      member,
      repo: data.repo,
    })
  }

  await publishNextPageStream(ctx, result)
}

const processRootStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubRootStream
  const repos = data.reposToCheck

  if (ctx.onboarding) {
    await capGithubArchive(ctx, repos)
  }

  const { gh } = getClient(ctx)

  // now it's time to start streams
  // derivative streams should be started later, otherwise conversations can't be created correctly
  for (const repo of repos) {
    const repoId = await gh.getRepoId({ repo: repo.url })
    for (const endpoint of [
      GithubStreamType.STARGAZERS,
      GithubStreamType.FORKS,
      GithubStreamType.PULLS,
      GithubStreamType.ISSUES,
      GithubStreamType.PULL_COMMITS,
      GithubStreamType.PULL_REVIEWS,
      GithubStreamType.PULL_COMMENTS,
      GithubStreamType.ISSUE_COMMENTS,
    ]) {
      // this firstPage thing is important to avoid duplicate streams and for handleNextPageStream to work
      await ctx.publishStream<GithubBasicStream>(`${endpoint}:${repo.name}:firstPage`, {
        repo,
        sf_repo_id: repoId,
        page: 1,
      })
    }
  }
}

const handler: ProcessStreamHandler = async (ctx) => {
  const streamIdentifier = ctx.stream.identifier

  if (streamIdentifier.startsWith(GithubStreamType.ROOT)) {
    await processRootStream(ctx)
  } else {
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
      case GithubStreamType.PULL_COMMITS:
        await processPullCommitsStream(ctx)
        break
      case GithubStreamType.PULL_REVIEWS:
        await processPullReviewsStream(ctx)
        break
      case GithubStreamType.ISSUES:
        await processIssuesStream(ctx)
        break
      case GithubStreamType.ISSUE_COMMENTS:
        await processIssueCommentsStream(ctx)
        break
      default:
        ctx.log.error(`No matching process function for streamType: ${streamType}`)
    }
  }
}

export default handler
