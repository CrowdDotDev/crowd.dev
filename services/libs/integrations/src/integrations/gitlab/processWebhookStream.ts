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
} from './types'
import { getUser } from './api/getUser'
import { Gitlab, UserSchema } from '@gitbeaker/rest'

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
  } else if (data.object_attributes.action === 'close') {
    user = await getUser(api, data.object_attributes.updated_by_id, ctx as IProcessStreamContext)
  } else {
    return
  }

  await ctx.processData<GitlabApiData<typeof data>>({
    data: {
      data: data,
      user: user,
    },
    type: GitlabWebhookType.ISSUE,
    projectId: data.project.id.toString(),
    pathWithNamespace: data.project.path_with_namespace,
    isWebhook: true,
  })
}

const handleIssueCommentWebhook: GitlabWebhookHandler = async (ctx, api, payload) => {
  const data = payload.data as GitlabIssueCommentWebhook

  if (data.object_attributes.action === 'create') {
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

const handler: ProcessWebhookStreamHandler = async (ctx) => {
  const payload = ctx.stream.data as GitlabWebhook
  const { data } = payload
  const api = new Gitlab({
    oauthToken: ctx.integration.token as string,
  })

  let type: 'note' | 'issue' | 'issue_comment' = data.object_kind

  if (type === 'note' && 'issue' in data) {
    type = 'issue_comment'
  }

  switch (type) {
    case 'issue':
      await handleIssueWebhook(ctx, api, payload)
      break
    case 'issue_comment':
      await handleIssueCommentWebhook(ctx, api, payload)
      break
    default:
      throw new Error(`Unsupported Gitlab webhook type: ${type}`)
  }
}

export default handler
