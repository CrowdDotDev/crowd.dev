import {
  IProcessWebhookStreamContext,
  ProcessWebhookStreamHandler,
  IProcessStreamContext,
} from '../../types'
import {
  GitlabApiData,
  GitlabWebhook,
  GitlabIssueWebhook,
  GitlabIssueCommentWebhook,
  GitlabWebhookType,
  GitlabMergeRequestWebhook,
  GitlabMergeRequestCommentWebhook,
} from './types'
import { getUser } from './api/getUser'
import { Gitlab, UserSchema } from '@gitbeaker/rest'
import verifyGitlabWebhook from './utils/verifyWebhook'

interface GitlabWebhookHandler {
  (
    ctx: IProcessWebhookStreamContext,
    api: InstanceType<typeof Gitlab>,
    payload: GitlabWebhook,
  ): Promise<void>
}

const handleIssueWebhook: GitlabWebhookHandler = async (ctx, api, payload) => {
  const data = payload.data as GitlabIssueWebhook

  let user: UserSchema

  if (data.object_attributes.action === 'open' || data.object_attributes.action === 'update') {
    user = await getUser(api, data.object_attributes.author_id, ctx as IProcessStreamContext)
    await ctx.processData<GitlabApiData<typeof data>>({
      data: {
        data: data,
        user: user,
      },
      type: GitlabWebhookType.ISSUE_OPENED_OR_UPDATED,
      projectId: data.project.id.toString(),
      pathWithNamespace: data.project.path_with_namespace,
      isWebhook: true,
    })
  } else if (data.object_attributes.action === 'close') {
    user = await getUser(api, data.object_attributes.updated_by_id, ctx as IProcessStreamContext)
    await ctx.processData<GitlabApiData<typeof data>>({
      data: {
        data: data,
        user: user,
      },
      type: GitlabWebhookType.ISSUE_CLOSED,
      projectId: data.project.id.toString(),
      pathWithNamespace: data.project.path_with_namespace,
      isWebhook: true,
    })
  } else {
    return
  }
}

const handleIssueCommentWebhook: GitlabWebhookHandler = async (ctx, api, payload) => {
  const data = payload.data as GitlabIssueCommentWebhook

  if (data.object_attributes.action === 'create' && data.object_attributes.system === false) {
    const user = await getUser(api, data.object_attributes.author_id, ctx as IProcessStreamContext)

    await ctx.processData<GitlabApiData<typeof data>>({
      data: {
        data: data,
        user: user,
      },
      type: GitlabWebhookType.ISSUE_COMMENT,
      projectId: data.project.id.toString(),
      pathWithNamespace: data.project.path_with_namespace,
      isWebhook: true,
    })
  }
}

const handleMergeRequestWebhook: GitlabWebhookHandler = async (ctx, api, payload) => {
  const data = payload.data as GitlabMergeRequestWebhook

  let user: UserSchema

  if (data.object_attributes.action === 'open') {
    user = await getUser(api, data.object_attributes.author_id, ctx as IProcessStreamContext)
    await ctx.processData<GitlabApiData<typeof data>>({
      data: {
        data: data,
        user: user,
      },
      type: GitlabWebhookType.MERGE_REQUEST_OPENED,
      projectId: data.project.id.toString(),
      pathWithNamespace: data.project.path_with_namespace,
      isWebhook: true,
    })
  } else if (data.object_attributes.action === 'close') {
    user = await getUser(api, data.object_attributes.updated_by_id, ctx as IProcessStreamContext)
    await ctx.processData<GitlabApiData<typeof data>>({
      data: {
        data: data,
        user: user,
      },
      type: GitlabWebhookType.MERGE_REQUEST_CLOSED,
      projectId: data.project.id.toString(),
      pathWithNamespace: data.project.path_with_namespace,
      isWebhook: true,
    })
  } else if (data.object_attributes.action === 'merge') {
    user = await getUser(api, data.object_attributes.updated_by_id, ctx as IProcessStreamContext)
    await ctx.processData<GitlabApiData<typeof data>>({
      data: {
        data: data,
        user: user,
      },
      type: GitlabWebhookType.MERGE_REQUEST_MERGED,
      projectId: data.project.id.toString(),
      pathWithNamespace: data.project.path_with_namespace,
      isWebhook: true,
    })
  } else if (data.object_attributes.action === 'approved') {
    user = await getUser(api, data.object_attributes.updated_by_id, ctx as IProcessStreamContext)
    await ctx.processData<GitlabApiData<typeof data>>({
      data: {
        data: data,
        user: user,
      },
      type: GitlabWebhookType.MERGE_REQUEST_REVIEW_APPROVED,
      projectId: data.project.id.toString(),
      pathWithNamespace: data.project.path_with_namespace,
      isWebhook: true,
    })
  } else if (data.object_attributes.action === 'update') {
    // assignees
    if (data.changes.assignees && Object.keys(data.changes.assignees).length > 0) {
      const previousAssignees = data.changes.assignees.previous as UserSchema[]
      const currentAssignees = data.changes.assignees.current as UserSchema[]
      const addedAssignees = currentAssignees.filter(
        (assignee) => !previousAssignees.some((prevAssignee) => prevAssignee.id === assignee.id),
      )

      if (addedAssignees.length > 0) {
        for (const assignee of addedAssignees) {
          user = await getUser(api, assignee.id, ctx as IProcessStreamContext)
          await ctx.processData<GitlabApiData<typeof data>>({
            data: {
              data: data,
              user: assignee,
            },
            type: GitlabWebhookType.MERGE_REQUEST_ASSIGNED,
            projectId: data.project.id.toString(),
            pathWithNamespace: data.project.path_with_namespace,
            isWebhook: true,
          })
        }
      }
    }

    if (data.changes.reviewers && Object.keys(data.changes.reviewers).length > 0) {
      const previousReviewers = data.changes.reviewers.previous as UserSchema[]
      const currentReviewers = data.changes.reviewers.current as UserSchema[]

      const addedReviewers = currentReviewers.filter(
        (reviewer) => !previousReviewers.some((prevReviewer) => prevReviewer.id === reviewer.id),
      )

      if (addedReviewers.length > 0) {
        for (const reviewer of addedReviewers) {
          user = await getUser(api, reviewer.id, ctx as IProcessStreamContext)
          await ctx.processData<GitlabApiData<typeof data>>({
            data: {
              data: data,
              user: reviewer,
            },
            type: GitlabWebhookType.MERGE_REQUEST_REVIEW_REQUESTED,
            projectId: data.project.id.toString(),
            pathWithNamespace: data.project.path_with_namespace,
            isWebhook: true,
          })
        }
      }
    }
  } else {
    ctx.log.warn('Unsupported Gitlab webhook type', data.object_attributes.action)
    return
  }
}

const handleMergeRequestCommentWebhook: GitlabWebhookHandler = async (ctx, api, payload) => {
  const data = payload.data as GitlabMergeRequestCommentWebhook

  if (data.object_attributes.action === 'create' && data.object_attributes.system === false) {
    const user = await getUser(api, data.object_attributes.author_id, ctx as IProcessStreamContext)

    await ctx.processData<GitlabApiData<typeof data>>({
      data: {
        data: data,
        user: user,
      },
      type: GitlabWebhookType.MERGE_REQUEST_COMMENT,
      projectId: data.project.id.toString(),
      pathWithNamespace: data.project.path_with_namespace,
      isWebhook: true,
    })
  }
}

const handler: ProcessWebhookStreamHandler = async (ctx) => {
  const payload = ctx.stream.data as GitlabWebhook
  const { data, headers } = payload
  const api = new Gitlab({
    oauthToken: ctx.integration.token as string,
  })

  try {
    verifyGitlabWebhook(ctx, headers)
  } catch (error) {
    ctx.log.error(error, 'Failed to verify Gitlab webhook', data, headers)
    throw error
  }

  let type: 'note' | 'issue' | 'issue_comment' | 'merge_request_comment' | 'merge_request' =
    data.object_kind

  if (type === 'note' && 'issue' in data) {
    type = 'issue_comment'
  } else if (type === 'note' && 'merge_request' in data) {
    type = 'merge_request_comment'
  }

  switch (type) {
    case 'issue':
      await handleIssueWebhook(ctx, api, payload)
      break
    case 'issue_comment':
      await handleIssueCommentWebhook(ctx, api, payload)
      break
    case 'merge_request':
      await handleMergeRequestWebhook(ctx, api, payload)
      break
    case 'merge_request_comment':
      await handleMergeRequestCommentWebhook(ctx, api, payload)
      break
    default:
      throw new Error(`Unsupported Gitlab webhook type: ${type}`)
  }
}

export default handler
