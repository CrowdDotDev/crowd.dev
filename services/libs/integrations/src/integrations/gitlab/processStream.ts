import { ProcessStreamHandler, IProcessStreamContext } from '../../types'
import { Gitlab } from '@gitbeaker/rest'
import {
  GitlabStreamType,
  GitlabBasicStream,
  GitlabRootStream,
  GitlabApiData,
  GitlabActivityData,
  GitlabActivityType,
  GitlabApiResult,
} from './types'
import { getIssues } from './api/getIssues'
import { getMergeRequests } from './api/getMergeRequests'
import { refreshToken } from './api/refreshToken'
import { getStars } from './api/getStars'
import { getForks } from './api/getForks'

interface GitlabStreamHandler {
  (
    ctx: IProcessStreamContext,
    api: InstanceType<typeof Gitlab>,
    data: GitlabBasicStream,
  ): Promise<void>
}

interface GitlabRootStreamHandler {
  (ctx: IProcessStreamContext, data: GitlabRootStream): Promise<void>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface GitlabProcessStreamResultHandler<T> {
  (
    ctx: IProcessStreamContext,
    result: GitlabApiResult<T>,
    activityType: GitlabActivityType,
    projectId: string,
    pathWithNamespace: string,
  ): Promise<void>
}

const handleRootStream: GitlabRootStreamHandler = async (ctx, data) => {
  // Refresh token if necessary
  if (ctx.integration.refreshToken) {
    const newTokens = await refreshToken(ctx)
    await ctx.updateIntegrationToken(newTokens.access_token)
    await ctx.updateIntegrationRefreshToken(newTokens.refresh_token)
  }

  for (const { id, path_with_namespace } of data.projects) {
    const streamTypes = [
      GitlabStreamType.ISSUES,
      GitlabStreamType.MERGE_REQUESTS,
      GitlabStreamType.STARS,
      GitlabStreamType.FORKS,
    ]

    for (const streamType of streamTypes) {
      await ctx.publishStream<GitlabBasicStream>(`${streamType}:${id}:firstPage`, {
        projectId: id,
        pathWithNamespace: path_with_namespace,
        page: 1,
      })
    }
  }
}

const handleIssuesStream: GitlabStreamHandler = async (ctx, api, data) => {
  const result = await getIssues({ api, projectId: data.projectId, page: data.page, ctx })
  await handleApiResult(
    ctx,
    result,
    GitlabActivityType.ISSUE,
    data.projectId,
    data.pathWithNamespace,
  )
}

const handleMergeRequestsStream: GitlabStreamHandler = async (ctx, api, data) => {
  const result = await getMergeRequests({ api, projectId: data.projectId, page: data.page, ctx })
  await handleApiResult(
    ctx,
    result,
    GitlabActivityType.MERGE_REQUEST,
    data.projectId,
    data.pathWithNamespace,
  )
}

const handleStarsStream: GitlabStreamHandler = async (ctx, api, data) => {
  const result = await getStars({ api, projectId: data.projectId, page: data.page, ctx })
  await handleApiResult(
    ctx,
    result,
    GitlabActivityType.STAR,
    data.projectId,
    data.pathWithNamespace,
  )
}

const handleForksStream: GitlabStreamHandler = async (ctx, api, data) => {
  const result = await getForks({ api, projectId: data.projectId, ctx })
  await handleApiResult(
    ctx,
    result,
    GitlabActivityType.FORK,
    data.projectId,
    data.pathWithNamespace,
  )
}

const handleApiResult: GitlabProcessStreamResultHandler<GitlabActivityData<any>[]> = async (
  ctx,
  result,
  activityType,
  projectId,
  pathWithNamespace,
) => {
  for (const item of result.data) {
    await ctx.processData<GitlabApiData<typeof item.data>>({
      data: {
        data: item.data,
        user: item.user,
      },
      type: activityType,
      projectId,
      pathWithNamespace,
    })
  }

  if (result.nextPage) {
    await ctx.publishStream<GitlabBasicStream>(`${activityType}:${projectId}:${result.nextPage}`, {
      projectId,
      pathWithNamespace,
      page: result.nextPage,
    })
  }
}

const handler: ProcessStreamHandler = async (ctx) => {
  const streamIdentifier = ctx.stream.identifier
  const data = ctx.stream.data

  const api = new Gitlab({
    oauthToken: ctx.integration.token,
  })

  if (streamIdentifier.startsWith(GitlabStreamType.ROOT)) {
    await handleRootStream(ctx, data as GitlabRootStream)
  } else {
    const streamType = streamIdentifier.split(':')[0] as GitlabStreamType

    switch (streamType) {
      case GitlabStreamType.ISSUES:
        await handleIssuesStream(ctx, api, data as GitlabBasicStream)
        break
      case GitlabStreamType.MERGE_REQUESTS:
        await handleMergeRequestsStream(ctx, api, data as GitlabBasicStream)
        break
      case GitlabStreamType.STARS:
        await handleStarsStream(ctx, api, data as GitlabBasicStream)
        break
      case GitlabStreamType.FORKS:
        await handleForksStream(ctx, api, data as GitlabBasicStream)
        break
      default:
        throw new Error(`Unsupported stream type: ${streamType}`)
    }
  }
}

export default handler
