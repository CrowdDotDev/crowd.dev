// processStream.ts content
import {
  GithubSnowflakeClient,
  IBasicResponse,
  IGetResponse,
  SnowflakeClient,
} from '@crowd/snowflake'

import { IProcessStreamContext, ProcessStreamHandler } from '../../types'

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

const initClient = (ctx: IProcessStreamContext) => {
  const settings = ctx.platformSettings as GithubPlatformSettings
  sf = new SnowflakeClient({
    privateKeyString: settings.privateKey,
    account: settings.account,
    username: settings.username,
    database: settings.database,
    warehouse: settings.warehouse,
  })
  gh = new GithubSnowflakeClient(sf)
}

const getClient = (ctx: IProcessStreamContext) => {
  if (!sf) {
    initClient(ctx)
  }
  return { sf, gh }
}

const prepareMember = (data: IBasicResponse): GithubPrepareMemberOutput => {
  return {
    memberFromApi: {
      id: data.actorId,
      login: data.actorLogin,
      avatarUrl: data.actorAvatarUrl,
    },
    orgs: [
      {
        id: data.orgId,
        login: data.orgLogin,
        avatarUrl: data.orgAvatarUrl,
      },
    ],
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
      page: response.nextPage,
    })
  }
}

const processStargazersStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const { gh } = getClient(ctx)

  const result = await gh.getRepoStargazers({ repo: data.repo.url, page: data.page })

  await publishNextPageStream(ctx, result)

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
}

const processForksStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubBasicStream
  const { gh } = getClient(ctx)

  const result = await gh.getRepoForks({ repo: data.repo.url, page: data.page })

  await publishNextPageStream(ctx, result)

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
}

const processRootStream: ProcessStreamHandler = async (ctx) => {
  const data = ctx.stream.data as GithubRootStream
  const repos = data.reposToCheck

  // now it's time to start streams
  for (const repo of repos) {
    for (const endpoint of [
      GithubStreamType.STARGAZERS,
      GithubStreamType.FORKS,
      GithubStreamType.PULLS,
      GithubStreamType.ISSUES,
    ]) {
      // this firstPage thing is important to avoid duplicate streams and for handleNextPageStream to work
      await ctx.publishStream<GithubBasicStream>(`${endpoint}:${repo.name}:firstPage`, {
        repo,
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
      default:
        console.error(`No matching process function for streamType: ${streamType}`)
    }
  }
}

export default handler
