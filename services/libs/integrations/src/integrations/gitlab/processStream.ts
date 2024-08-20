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
import { getUser } from './api/getUser'
import { getIssueComments } from './api/getIssueComments'
import { getMergeRequestComments } from './api/getMergeRequestComments'
import { getIssueDiscussions } from './api/getIssueDiscussions'

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
    const streamTypes = ctx.onboarding
      ? [
          GitlabStreamType.ISSUES,
          GitlabStreamType.MERGE_REQUESTS,
          GitlabStreamType.STARS,
          GitlabStreamType.FORKS,
        ]
      : [GitlabStreamType.STARS, GitlabStreamType.FORKS]

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

  // issue opened
  await handleApiResult(
    ctx,
    result,
    GitlabActivityType.ISSUE_OPENED,
    data.projectId,
    data.pathWithNamespace,
  )

  // issue closed
  for (const item of result.data) {
    if (item.data.closed_at) {
      const user = await getUser(api, parseInt(item.data.closed_by))
      await ctx.processData<GitlabApiData<typeof item.data>>({
        data: {
          data: item.data,
          user,
        },
        type: GitlabActivityType.ISSUE_CLOSED,
        projectId: data.projectId,
        pathWithNamespace: data.pathWithNamespace,
      })
    }
  }

  // issue comments
  for (const item of result.data) {
    await ctx.publishStream<GitlabBasicStream>(
      `${GitlabStreamType.ISSUE_COMMENTS}:${data.projectId}:${item.data.id}:firstPage`,
      {
        projectId: data.projectId,
        pathWithNamespace: data.pathWithNamespace,
        meta: {
          issueIId: item.data.iid,
        },
        page: 1,
      },
    )

    await ctx.publishStream<GitlabBasicStream>(
      `${GitlabStreamType.ISSUE_DISCUSSIONS}:${data.projectId}:${item.data.id}:firstPage`,
      {
        projectId: data.projectId,
        pathWithNamespace: data.pathWithNamespace,
        meta: {
          issueIId: item.data.iid,
        },
        page: 1,
      },
    )
  }
}

const handleIssueCommentsStream: GitlabStreamHandler = async (ctx, api, data) => {
  const result = await getIssueComments({
    api,
    projectId: data.projectId,
    issueIId: data.meta.issueIId as number,
    page: data.page,
    ctx,
  })
  await handleApiResult(
    ctx,
    result,
    GitlabActivityType.ISSUE_COMMENT,
    data.projectId,
    data.pathWithNamespace,
  )
}

const handleIssueDiscussionsStream: GitlabStreamHandler = async (ctx, api, data) => {
  const result = await getIssueDiscussions({
    api,
    projectId: data.projectId,
    issueIId: data.meta.issueIId as number,
    page: data.page,
    ctx,
  })
  await handleApiResult(
    ctx,
    result,
    GitlabActivityType.ISSUE_COMMENT,
    data.projectId,
    data.pathWithNamespace,
  )
}

const handleMergeRequestsStream: GitlabStreamHandler = async (ctx, api, data) => {
  const result = await getMergeRequests({ api, projectId: data.projectId, page: data.page, ctx })

  // Opened
  await handleApiResult(
    ctx,
    result,
    GitlabActivityType.MERGE_REQUEST_OPENED,
    data.projectId,
    data.pathWithNamespace,
  )

  for (const item of result.data) {
    // Merged
    if (item.data.merged_at) {
      const user = await getUser(api, item.data.merged_by.id)
      await ctx.processData<GitlabApiData<typeof item.data>>({
        data: {
          data: item.data,
          user,
        },
        type: GitlabActivityType.MERGE_REQUEST_CLOSED,
        projectId: data.projectId,
        pathWithNamespace: data.pathWithNamespace,
      })
    }

    // Closed
    if (item.data.closed_at) {
      const user = await getUser(api, item.data.closed_by.id)
      await ctx.processData<GitlabApiData<typeof item.data>>({
        data: {
          data: item.data,
          user,
        },
        type: GitlabActivityType.MERGE_REQUEST_CLOSED,
        projectId: data.projectId,
        pathWithNamespace: data.pathWithNamespace,
      })
    }

    // comments
    await ctx.publishStream<GitlabBasicStream>(
      `${GitlabStreamType.MERGE_REQUEST_COMMENTS}:${data.projectId}:${item.data.id}:firstPage`,
      {
        projectId: data.projectId,
        pathWithNamespace: data.pathWithNamespace,
        meta: {
          mergeRequestIId: item.data.iid,
        },
        page: 1,
      },
    )
  }
}

const handleMergeRequestCommentsStream: GitlabStreamHandler = async (ctx, api, data) => {
  const result = await getMergeRequestComments({
    api,
    projectId: data.projectId,
    mergeRequestIId: data.meta.mergeRequestIId as number,
    page: data.page,
    ctx,
  })
  await handleApiResult(
    ctx,
    result,
    GitlabActivityType.MERGE_REQUEST_COMMENT,
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
      case GitlabStreamType.ISSUE_COMMENTS:
        await handleIssueCommentsStream(ctx, api, data as GitlabBasicStream)
        break
      case GitlabStreamType.ISSUE_DISCUSSIONS:
        await handleIssueDiscussionsStream(ctx, api, data as GitlabBasicStream)
        break
      case GitlabStreamType.MERGE_REQUESTS:
        await handleMergeRequestsStream(ctx, api, data as GitlabBasicStream)
        break
      case GitlabStreamType.MERGE_REQUEST_COMMENTS:
        await handleMergeRequestCommentsStream(ctx, api, data as GitlabBasicStream)
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
