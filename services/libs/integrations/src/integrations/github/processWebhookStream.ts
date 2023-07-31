/* eslint-disable  @typescript-eslint/no-explicit-any */
import {
  IProcessWebhookStreamContext,
  ProcessWebhookStreamHandler,
  IProcessStreamContext,
} from '@/types'
import {
  GithubWebhookPayload,
  GithubPlatformSettings,
  GithubWehookEvent,
  GithubWebhookData,
  GithubPrepareMemberOutput,
  GithubWebhookSubType,
  GithubStreamType,
  Repo,
  GithubBasicStream,
} from './types'
import verifyGithubWebhook from 'verify-github-webhook'
import getMember from './api/graphql/members'
import { prepareMember } from './processStream'
import TeamsQuery from './api/graphql/teams'
import { GithubWebhookTeam } from './api/graphql/types'
import { processPullCommitsStream } from './processStream'

const IS_TEST_ENV: boolean = process.env.NODE_ENV === 'test'

const prepareWebhookMember = async (
  login: string,
  ctx: IProcessWebhookStreamContext,
): Promise<GithubPrepareMemberOutput> => {
  if (IS_TEST_ENV) {
    return {
      memberFromApi: {
        login: 'testMember',
        name: 'testMember',
      },
      email: '',
      orgs: [],
    }
  }

  const member = await getMember(login, ctx.integration.token)
  const preparedMember = await prepareMember(member, ctx as IProcessStreamContext)
  return preparedMember
}

async function verifyWebhookSignature(
  signature: string,
  data: any,
  ctx: IProcessWebhookStreamContext,
): Promise<void> {
  if (IS_TEST_ENV) {
    return
  }

  const GITHUB_CONFIG = ctx.platformSettings as GithubPlatformSettings
  const secret = GITHUB_CONFIG.webhookSecret

  let isVerified: boolean
  try {
    isVerified = verifyGithubWebhook(signature, JSON.stringify(data), secret) // Returns true if verification succeeds; otherwise, false.
  } catch (err) {
    await ctx.abortWithError(`Error during Github webhook verificaion\n${err}`)
  }

  if (!isVerified) {
    await ctx.abortWithError('Github webhook not verified')
  }
}

const parseWebhookIssue = async (payload: any, ctx: IProcessWebhookStreamContext) => {
  const member = await prepareWebhookMember(payload.sender.login, ctx)

  await ctx.publishData<GithubWebhookData>({
    webhookType: GithubWehookEvent.ISSUES,
    data: payload,
    member,
  })
}

const parseWebhookDiscussion = async (payload: any, ctx: IProcessWebhookStreamContext) => {
  let member: GithubPrepareMemberOutput | undefined
  if (payload.action === 'answered') {
    member = await prepareWebhookMember(payload.sender.login, ctx)

    await ctx.publishData<GithubWebhookData>({
      webhookType: GithubWehookEvent.DISCUSSION,
      subType: GithubWebhookSubType.DISCUSSION_COMMENT_REPLY,
      data: payload,
      member,
    })
  }

  if (!['edited', 'created'].includes(payload.action)) {
    return
  }

  const discussion = payload.discussion
  member = await prepareWebhookMember(discussion.user.login, ctx)

  await ctx.publishData<GithubWebhookData>({
    webhookType: GithubWehookEvent.DISCUSSION,
    subType: GithubWebhookSubType.DISCUSSION_COMMENT_START,
    data: payload,
    member,
  })
}

const parseWebhookPullRequestEvents = async (
  payload: any,
  ctx: IProcessWebhookStreamContext,
): Promise<void> => {
  const member = await prepareWebhookMember(payload.sender.login, ctx)
  let objectMember: GithubPrepareMemberOutput | undefined

  const GITHUB_CONFIG = ctx.platformSettings as GithubPlatformSettings
  const IS_GITHUB_COMMIT_DATA_ENABLED = GITHUB_CONFIG.isCommitDataEnabled === 'true'

  switch (payload.action) {
    case 'edited':
    case 'opened':
    case 'reopened':
    case 'closed':
    case 'merged': {
      await ctx.publishData<GithubWebhookData>({
        webhookType: GithubWehookEvent.PULL_REQUEST,
        data: payload,
        member,
      })
      break
    }
    case 'assigned':
    case 'review_requested': {
      objectMember = await prepareWebhookMember(payload.requested_reviewer.login, ctx)

      await ctx.publishData<GithubWebhookData>({
        webhookType: GithubWehookEvent.PULL_REQUEST,
        data: payload,
        member,
        objectMember,
      })
      break
    }
    case 'synchronize': {
      if (IS_GITHUB_COMMIT_DATA_ENABLED) {
        const prNumber = payload.number
        const repo: Repo = {
          name: payload.repository.name,
          owner: payload.repository.owner.login,
          url: payload.repository.html_url,
          createdAt: payload.repository.created_at,
        }

        // this will create a CROWD_GENERATED webhook and stream for it
        // this way we don't need integration run to publish new streams
        await ctx.publishStream<GithubBasicStream>(
          `${GithubStreamType.PULL_COMMITS}:${prNumber}:firstPage`,
          {
            repo,
            page: '',
            prNumber,
          },
        )
      }
      break
    }
  }
}

const parseWebhookPullRequest = async (payload: any, ctx: IProcessWebhookStreamContext) => {
  // handle case of multiple reviewers (by assigning a team as a reviewer)
  if (payload.action === 'review_requested' && payload.requested_team) {
    // a team sent as reviewer, first we need to find members in this team
    const team: GithubWebhookTeam = payload.requested_team
    const teamMembers = await new TeamsQuery(team.node_id, ctx.integration.token).getSinglePage('')

    for (const teamMember of teamMembers.data) {
      await parseWebhookPullRequestEvents({ ...payload, requested_reviewer: teamMember }, ctx)
    }

    return
  }

  if (payload.action === 'closed' && payload.pull_request.merged) {
    const revisedPayload = { ...payload, action: 'merged' }
    revisedPayload.pull_request.state = 'merged'

    await parseWebhookPullRequestEvents(revisedPayload, ctx)

    return
  }

  await parseWebhookPullRequestEvents(payload, ctx)
}

const parseWebhookPullRequestReview = async (
  payload: any,
  ctx: IProcessWebhookStreamContext,
): Promise<void> => {
  if (payload.action === 'submitted') {
    // additional comments to existing review threads also result in submitted events
    // since these will be handled in pull_request_review_comment.created events
    // we're ignoring when state is commented and it has no body.
    if (payload.review.state === 'commented' && payload.review.body === null) {
      return
    }

    const member = await prepareWebhookMember(payload.sender.login, ctx)

    await ctx.publishData<GithubWebhookData>({
      webhookType: GithubWehookEvent.PULL_REQUEST_REVIEW,
      data: payload,
      member,
    })
  }
}

const parseWebhookStar = async (payload: any, ctx: IProcessWebhookStreamContext) => {
  if (payload.action === 'created' || payload.action === 'deleted') {
    const member = await prepareWebhookMember(payload.sender.login, ctx)

    if (member && payload.starred_at !== null) {
      await ctx.publishData<GithubWebhookData>({
        webhookType: GithubWehookEvent.STAR,
        data: payload,
        member,
      })
    }
  }
}

const parseWebhookFork = async (payload: any, ctx: IProcessWebhookStreamContext) => {
  const member = await prepareWebhookMember(payload.sender.login, ctx)

  if (member) {
    await ctx.publishData<GithubWebhookData>({
      webhookType: GithubWehookEvent.FORK,
      data: payload,
      member,
    })
  }
}

const parseWebhookComment = async (
  event: string,
  payload: any,
  ctx: IProcessWebhookStreamContext,
) => {
  let type: GithubWehookEvent
  let sourceParentId: string

  switch (event) {
    case 'discussion_comment': {
      switch (payload.action) {
        case 'created':
        case 'edited':
          type = GithubWehookEvent.DISCUSSION_COMMENT
          sourceParentId = payload.discussion.node_id.toString()
          break
        default:
          return undefined
      }
      break
    }

    case 'issue_comment': {
      switch (payload.action) {
        case 'created':
        case 'edited': {
          if ('pull_request' in payload.issue) {
            type = GithubWehookEvent.PULL_REQUEST_COMMENT
          } else {
            type = GithubWehookEvent.ISSUE_COMMENT
          }
          sourceParentId = payload.issue.node_id.toString()
          break
        }

        default:
          return
      }
      break
    }

    default: {
      return
    }
  }

  const member = await prepareWebhookMember(payload.sender.login, ctx)

  if (member) {
    await ctx.publishData<GithubWebhookData>({
      webhookType: type,
      data: payload,
      member,
      sourceParentId,
    })
  }
}

const parseWebhookPullRequestReviewComment = async (
  payload: any,
  ctx: IProcessWebhookStreamContext,
) => {
  if (payload.action === 'created') {
    const member = await prepareWebhookMember(payload.comment.user.login, ctx)

    if (member) {
      await ctx.publishData<GithubWebhookData>({
        webhookType: GithubWehookEvent.PULL_REQUEST_REVIEW_COMMENT,
        data: payload,
        member,
      })
    }
  }
}

const handler: ProcessWebhookStreamHandler = async (ctx) => {
  const identifier = ctx.stream.identifier

  // this is for pull request commits which are published during runtime
  if (identifier.startsWith(GithubStreamType.PULL_COMMITS)) {
    // we are reusing code here with another type of context
    // everything should work except for ctx.aborRuntWithError
    await processPullCommitsStream(ctx as IProcessStreamContext)
  } else {
    // this is for normal weqbook events
    const { signature, event, data } = ctx.stream.data as GithubWebhookPayload

    await verifyWebhookSignature(signature, data, ctx)

    switch (event) {
      case GithubWehookEvent.ISSUES:
        await parseWebhookIssue(data, ctx)
        break
      case GithubWehookEvent.DISCUSSION:
        await parseWebhookDiscussion(data, ctx)
        break
      case GithubWehookEvent.PULL_REQUEST:
        await parseWebhookPullRequest(data, ctx)
        break
      case GithubWehookEvent.PULL_REQUEST_REVIEW:
        await parseWebhookPullRequestReview(data, ctx)
        break
      case GithubWehookEvent.STAR:
        await parseWebhookStar(data, ctx)
        break
      case GithubWehookEvent.FORK:
        await parseWebhookFork(data, ctx)
        break
      case GithubWehookEvent.DISCUSSION_COMMENT:
      case GithubWehookEvent.ISSUE_COMMENT:
        await parseWebhookComment(event, data, ctx)
        break
      case GithubWehookEvent.PULL_REQUEST_REVIEW_COMMENT:
        await parseWebhookPullRequestReviewComment(data, ctx)
        break
      default:
        await ctx.abortWithError(`Unknown Github webhook event: ${event}`)
    }
  }
}

export default handler
