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
import { getMergeRequestEvents } from './api/getMergeRequestEvents'
import { getMergeRequestDiscussions } from './api/getMergeRequestDiscussions'
import { getIssueDiscussions } from './api/getIssueDiscussions'
import { getUserByUsername } from './api/getUser'
import { getMergeRequestCommits } from './api/getMergeRequestCommits'
import { timeout } from '@crowd/common'

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
      ctx.log.info(item)
      // @ts-expect-error closed_by might be a json
      const user = await getUser(api, parseInt(item.data.closed_by) || item.data.closed_by.id, ctx)
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

const handleIssueDiscussionsStream: GitlabStreamHandler = async (ctx, api, data) => {
  const result = await getIssueDiscussions({
    api,
    projectId: data.projectId,
    issueIId: data?.meta?.issueIId as number,
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
      const user = await getUser(api, item.data.merged_by.id, ctx)
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
      const user = await getUser(api, item.data.closed_by.id, ctx)
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
      `${GitlabStreamType.MERGE_REQUEST_DISCUSSIONS}:${data.projectId}:${item.data.id}:firstPage`,
      {
        projectId: data.projectId,
        pathWithNamespace: data.pathWithNamespace,
        meta: {
          mergeRequestIId: item.data.iid,
        },
        page: 1,
      },
    )

    await timeout(3000)
    // events
    await ctx.publishStream<GitlabBasicStream>(
      `${GitlabStreamType.MERGE_REQUEST_EVENTS}:${data.projectId}:${item.data.id}:firstPage`,
      {
        projectId: data.projectId,
        pathWithNamespace: data.pathWithNamespace,
        meta: {
          mergeRequestIId: item.data.iid,
        },
        page: 1,
      },
    )

    await timeout(3000)
    // Add this new stream for merge request commits
    await ctx.publishStream<GitlabBasicStream>(
      `${GitlabStreamType.MERGE_REQUEST_COMMITS}:${data.projectId}:${item.data.id}:firstPage`,
      {
        projectId: data.projectId,
        pathWithNamespace: data.pathWithNamespace,
        meta: {
          mergeRequestIId: item.data.iid,
          mergeRequestId: item.data.id,
        },
        page: 1,
      },
    )
  }
}

const handleMergeRequestDiscussionsStream: GitlabStreamHandler = async (ctx, api, data) => {
  const result = await getMergeRequestDiscussions({
    api,
    projectId: data.projectId,
    mergeRequestIId: data?.meta?.mergeRequestIId as number,
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

const handleMergeRequestEventsStream: GitlabStreamHandler = async (ctx, api, data) => {
  const result = await getMergeRequestEvents({
    api,
    projectId: data.projectId,
    mergeRequestIId: data?.meta?.mergeRequestIId as number,
    page: data.page,
    ctx,
  })

  for (const item of result.data) {
    await timeout(3000)
    const note = item.data
    if (note.body.startsWith('assigned to @')) {
      const assignedMatches = note.body.match(/assigned to @(\w+)/g)
      if (assignedMatches) {
        const assignees = assignedMatches.map((match) => match.split('@')[1])
        const relatedUser = await getUserByUsername(api, assignees[0], ctx)
        await ctx.processData<GitlabApiData<typeof item.data>>({
          data: {
            data: item.data,
            user: item.user,
            relatedUser,
          },
          type: GitlabActivityType.MERGE_REQUEST_ASSIGNED,
          projectId: data.projectId,
          pathWithNamespace: data.pathWithNamespace,
        })
      }
    } else if (note.body.startsWith('requested review from @')) {
      const reviewerMatches = note.body.match(/requested review from @(\w+)/g)
      if (reviewerMatches) {
        const reviewers = reviewerMatches.map((match) => match.split('@')[1])
        const relatedUser = await getUserByUsername(api, reviewers[0], ctx)
        await ctx.processData<GitlabApiData<typeof item.data>>({
          data: {
            data: item.data,
            user: item.user,
            relatedUser,
          },
          type: GitlabActivityType.MERGE_REQUEST_REVIEW_REQUESTED,
          projectId: data.projectId,
          pathWithNamespace: data.pathWithNamespace,
        })
      }
      //
    } else if (note.body.startsWith('approved this merge request')) {
      await ctx.processData<GitlabApiData<typeof item.data>>({
        data: {
          data: item.data,
          user: item.user,
        },
        type: GitlabActivityType.MERGE_REQUEST_REVIEW_APPROVED,
        projectId: data.projectId,
        pathWithNamespace: data.pathWithNamespace,
      })
    } else if (note.body.startsWith('requested changes')) {
      await ctx.processData<GitlabApiData<typeof item.data>>({
        data: {
          data: item.data,
          user: item.user,
        },
        type: GitlabActivityType.MERGE_REQUEST_REVIEW_CHANGES_REQUESTED,
        projectId: data.projectId,
        pathWithNamespace: data.pathWithNamespace,
      })
    } else {
      ctx.log.debug(`Unhandled merge request event: ${note.body}`)
    }
  }

  if (result.nextPage) {
    await ctx.publishStream<GitlabBasicStream>(
      `${GitlabStreamType.MERGE_REQUEST_EVENTS}:${data.projectId}:${result.nextPage}`,
      {
        projectId: data.projectId,
        pathWithNamespace: data.pathWithNamespace,
        page: result.nextPage,
      },
    )
  }
}

const handleMergeRequestCommitsStream: GitlabStreamHandler = async (ctx, api, data) => {
  const result = await getMergeRequestCommits({
    api,
    projectId: data.projectId,
    mergeRequestIId: data?.meta?.mergeRequestIId as number,
    page: data.page,
    ctx,
  })

  for (const commit of result.data) {
    await ctx.processData<GitlabApiData<typeof commit>>({
      data: {
        data: commit,
        relatedData: {
          mergeRequestIId: data?.meta?.mergeRequestIId,
          mergeRequestId: data?.meta?.mergeRequestId,
        },
      },
      type: GitlabActivityType.AUTHORED_COMMIT,
      projectId: data.projectId,
      pathWithNamespace: data.pathWithNamespace,
    })
  }

  if (result.nextPage) {
    await ctx.publishStream<GitlabBasicStream>(
      `${GitlabStreamType.MERGE_REQUEST_COMMITS}:${data.projectId}:${result.nextPage}`,
      {
        projectId: data.projectId,
        pathWithNamespace: data.pathWithNamespace,
        meta: {
          mergeRequestIId: data?.meta?.mergeRequestIId,
        },
        page: result.nextPage,
      },
    )
  }
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
    oauthToken: ctx.integration.token as string,
  })

  if (streamIdentifier.startsWith(GitlabStreamType.ROOT)) {
    await handleRootStream(ctx, data as GitlabRootStream)
  } else {
    const streamType = streamIdentifier.split(':')[0] as GitlabStreamType

    switch (streamType) {
      case GitlabStreamType.ISSUES:
        await handleIssuesStream(ctx, api, data as GitlabBasicStream)
        break
      case GitlabStreamType.ISSUE_DISCUSSIONS:
        await handleIssueDiscussionsStream(ctx, api, data as GitlabBasicStream)
        break
      case GitlabStreamType.MERGE_REQUESTS:
        await handleMergeRequestsStream(ctx, api, data as GitlabBasicStream)
        break
      case GitlabStreamType.MERGE_REQUEST_EVENTS:
        await handleMergeRequestEventsStream(ctx, api, data as GitlabBasicStream)
        break
      case GitlabStreamType.MERGE_REQUEST_DISCUSSIONS:
        await handleMergeRequestDiscussionsStream(ctx, api, data as GitlabBasicStream)
        break
      case GitlabStreamType.STARS:
        await handleStarsStream(ctx, api, data as GitlabBasicStream)
        break
      case GitlabStreamType.FORKS:
        await handleForksStream(ctx, api, data as GitlabBasicStream)
        break
      case GitlabStreamType.MERGE_REQUEST_COMMITS:
        await handleMergeRequestCommitsStream(ctx, api, data as GitlabBasicStream)
        break
      default:
        throw new Error(`Unsupported stream type: ${streamType}`)
    }
  }
}

export default handler
