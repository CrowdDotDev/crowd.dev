/* eslint-disable  @typescript-eslint/no-explicit-any */
// processStream.ts content
// processData.ts content
import { IProcessDataContext, ProcessDataHandler } from '../../types'
import {
  GithubApiData,
  GithubWebhookData,
  GithubActivityType,
  GithubPrepareMemberOutput,
  GithubActivitySubType,
  GithubWehookEvent,
} from './types'
import {
  IActivityData,
  IMemberData,
  PlatformType,
  MemberAttributeName,
  IActivityScoringGrid,
} from '@crowd/types'
import { GITHUB_GRID } from './grid'
import { generateSourceIdHash } from '../../helpers'

const IS_TEST_ENV: boolean = process.env.NODE_ENV === 'test'

const parseMember = (memberData: GithubPrepareMemberOutput): IMemberData => {
  const { email, orgs, memberFromApi } = memberData

  const member: IMemberData = {
    identities: [
      {
        platform: PlatformType.GITHUB,
        username: memberFromApi.login,
      },
    ],
    displayName: memberFromApi.name,
    attributes: {
      [MemberAttributeName.IS_HIREABLE]: {
        [PlatformType.GITHUB]: memberFromApi.isHireable || false,
      },
      [MemberAttributeName.URL]: {
        [PlatformType.GITHUB]: memberFromApi.url,
      },
      [MemberAttributeName.BIO]: {
        [PlatformType.GITHUB]: memberFromApi.bio || '',
      },
      [MemberAttributeName.LOCATION]: {
        [PlatformType.GITHUB]: memberFromApi.location || '',
      },
      [MemberAttributeName.AVATAR_URL]: {
        [PlatformType.GITHUB]: memberFromApi.avatarUrl || '',
      },
    },
    emails: email ? [email] : [],
  }

  if (memberFromApi.websiteUrl) {
    member.attributes[MemberAttributeName.WEBSITE_URL] = {
      [PlatformType.GITHUB]: memberFromApi.websiteUrl,
    }
  }

  if (memberFromApi.company) {
    if (IS_TEST_ENV) {
      member.organizations = [{ name: 'crowd.dev' }]
    } else {
      const company = memberFromApi.company.replace('@', '').trim()

      if (orgs) {
        member.organizations = [
          {
            name: orgs.name,
            description: orgs.description ?? null,
            location: orgs.location ?? null,
            logo: orgs.avatarUrl ?? null,
            url: orgs.url ?? null,
            github: orgs.url ? orgs.url.replace('https://github.com/', '') : null,
            twitter: orgs.twitterUsername ? orgs.twitterUsername : null,
            website: orgs.websiteUrl ?? null,
          },
        ]
      } else {
        member.organizations = [{ name: company }]
      }
    }
  }

  // if (memberFromApi.followers && memberFromApi.followers.totalCount > 0) {
  //   member.reach = { [PlatformType.GITHUB]: memberFromApi.followers.totalCount }
  // }

  return member
}

const parseStar: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.STAR,
    sourceId: generateSourceIdHash(
      data.node.login,
      GithubActivityType.STAR,
      Math.floor(new Date(data.starredAt).getTime() / 1000).toString(),
      PlatformType.GITHUB,
    ),
    sourceParentId: '',
    timestamp: new Date(data.starredAt).toISOString(),
    channel: apiData.repo.url,
    member,
    score: GITHUB_GRID.star.score,
    isContribution: GITHUB_GRID.star.isContribution,
  }

  await ctx.publishActivity(activity)
}

const parseFork: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.FORK,
    sourceId: data.id,
    sourceParentId: '',
    timestamp: new Date(data.starredAt).toISOString(),
    channel: apiData.repo.url,
    member,
    score: GITHUB_GRID.fork.score,
    isContribution: GITHUB_GRID.fork.isContribution,
  }

  await ctx.publishActivity(activity)
}

const parsePullRequestOpened: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_OPENED,
    sourceId: data.id,
    sourceParentId: '',
    timestamp: new Date(data.createdAt).toISOString(),
    body: data.bodyText,
    url: data.url ? data.url : '',
    channel: apiData.repo.url,
    title: data.title,
    attributes: {
      state: data.state.toLowerCase(),
      additions: data.additions,
      deletions: data.deletions,
      changedFiles: data.changedFiles,
      authorAssociation: data.authorAssociation,
      labels: data.labels?.nodes.map((l) => l.name),
    },
    member,
    score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_OPENED].score,
    isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_OPENED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parsePullRequestClosed: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const relatedData = apiData.relatedData
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_CLOSED,
    sourceId: `gen-CE_${relatedData.sourceId}_${memberData.memberFromApi.login}_${new Date(
      data.createdAt,
    ).toISOString()}`,
    sourceParentId: relatedData.sourceId,
    timestamp: new Date(data.createdAt).toISOString(),
    body: '',
    url: relatedData.url,
    channel: relatedData.channel,
    title: '',
    attributes: {
      state: (relatedData.attributes as any).state,
      additions: (relatedData.attributes as any).additions,
      deletions: (relatedData.attributes as any).deletions,
      changedFiles: (relatedData.attributes as any).changedFiles,
      authorAssociation: (relatedData.attributes as any).authorAssociation,
      labels: (relatedData.attributes as any).labels,
    },
    member,
    score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_CLOSED].score,
    isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_CLOSED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parsePullRequestReviewRequested: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const relatedData = apiData.relatedData
  const memberData = apiData.member
  const objectMemberData = apiData.objectMember

  const member = parseMember(memberData)
  const objectMember = parseMember(objectMemberData)

  const subType = apiData.subType

  const sourceId =
    subType === GithubActivitySubType.PULL_REQUEST_REVIEW_REQUESTED_SINGLE
      ? `gen-RRE_${relatedData.sourceId}_${memberData.memberFromApi.login}_${
          objectMemberData.memberFromApi.login
        }_${new Date(data.createdAt).toISOString()}`
      : `gen-RRE_${relatedData.sourceId}_${memberData.memberFromApi.login}_${
          objectMemberData.memberFromApi.login
        }_${new Date(data.createdAt).toISOString()}`

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED,
    sourceId: sourceId,
    sourceParentId: relatedData.sourceId,
    timestamp: new Date(data.createdAt).toISOString(),
    body: '',
    url: relatedData.url,
    channel: relatedData.channel,
    title: '',
    attributes: {
      state: (relatedData.attributes as any).state,
      additions: (relatedData.attributes as any).additions,
      deletions: (relatedData.attributes as any).deletions,
      changedFiles: (relatedData.attributes as any).changedFiles,
      authorAssociation: (relatedData.attributes as any).authorAssociation,
      labels: (relatedData.attributes as any).labels,
    },
    member,
    objectMember,
    score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED].score,
    isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parsePullRequestReviewed: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const relatedData = apiData.relatedData
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_REVIEWED,
    sourceId: `gen-PRR_${relatedData.sourceId}_${memberData.memberFromApi.login}_${new Date(
      data.createdAt,
    ).toISOString()}`,
    sourceParentId: relatedData.sourceId,
    timestamp: new Date(data.createdAt).toISOString(),
    url: relatedData.url,
    channel: apiData.repo.url,
    title: '',
    attributes: {
      reviewState: data.state,
      state: (relatedData.attributes as any).state,
      additions: (relatedData.attributes as any).additions,
      deletions: (relatedData.attributes as any).deletions,
      changedFiles: (relatedData.attributes as any).changedFiles,
      authorAssociation: (relatedData.attributes as any).authorAssociation,
      labels: (relatedData.attributes as any).labels,
    },
    member,
    score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEWED].score,
    isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEWED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parsePullRequestAssigned: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const relatedData = apiData.relatedData
  const memberData = apiData.member
  const objectMemberData = apiData.objectMember

  const member = parseMember(memberData)
  const objectMember = parseMember(objectMemberData)

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_ASSIGNED,
    sourceId: `gen-AE_${relatedData.sourceId}_${memberData.memberFromApi.login}_${
      objectMemberData.memberFromApi.login
    }_${new Date(data.createdAt).toISOString()}`,
    sourceParentId: relatedData.sourceId,
    timestamp: new Date(data.createdAt).toISOString(),
    body: '',
    url: relatedData.url,
    channel: apiData.repo.url,
    title: '',
    attributes: {
      state: (relatedData.attributes as any).state,
      additions: (relatedData.attributes as any).additions,
      deletions: (relatedData.attributes as any).deletions,
      changedFiles: (relatedData.attributes as any).changedFiles,
      authorAssociation: (relatedData.attributes as any).authorAssociation,
      labels: (relatedData.attributes as any).labels,
    },
    member,
    objectMember,
    score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_ASSIGNED].score,
    isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_ASSIGNED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parsePullRequestMerged: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const relatedData = apiData.relatedData
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_MERGED,
    sourceId: `gen-ME_${relatedData.sourceId}_${memberData.memberFromApi.login}_${new Date(
      data.createdAt,
    ).toISOString()}`,
    sourceParentId: relatedData.sourceId,
    timestamp: new Date(data.createdAt).toISOString(),
    body: '',
    url: relatedData.url,
    channel: apiData.repo.url,
    title: '',
    attributes: {
      state: (relatedData.attributes as any).state,
      additions: (relatedData.attributes as any).additions,
      deletions: (relatedData.attributes as any).deletions,
      changedFiles: (relatedData.attributes as any).changedFiles,
      authorAssociation: (relatedData.attributes as any).authorAssociation,
      labels: (relatedData.attributes as any).labels,
    },
    member,
    score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_MERGED].score,
    isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_MERGED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parseIssueOpened: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.ISSUE_OPENED,
    sourceId: data.id,
    sourceParentId: '',
    timestamp: new Date(data.createdAt).toISOString(),
    body: data.bodyText,
    url: data.url ? data.url : '',
    channel: apiData.repo.url,
    title: data.title.replace(/\0/g, ''),
    attributes: {
      state: data.state.toLowerCase(),
    },
    member,
    score: GITHUB_GRID[GithubActivityType.ISSUE_OPENED].score,
    isContribution: GITHUB_GRID[GithubActivityType.ISSUE_OPENED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parseIssueClosed: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const relatedData = apiData.relatedData
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.ISSUE_CLOSED,
    sourceId: `gen-CE_${relatedData.sourceId}_${memberData.memberFromApi.login}_${new Date(
      data.createdAt,
    ).toISOString()}`,
    sourceParentId: relatedData.sourceId,
    timestamp: new Date(data.createdAt).toISOString(),
    body: '',
    url: relatedData.url,
    channel: relatedData.channel,
    title: '',
    attributes: {
      state: (relatedData.attributes as any).state,
    },
    member,
    score: GITHUB_GRID[GithubActivityType.ISSUE_CLOSED].score,
    isContribution: GITHUB_GRID[GithubActivityType.ISSUE_CLOSED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parsePullRequestComment: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_COMMENT,
    sourceId: data.id,
    sourceParentId: data.pullRequest.id,
    timestamp: new Date(data.createdAt).toISOString(),
    url: data.url,
    body: data.bodyText,
    channel: apiData.repo.url,
    member,
    score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_COMMENT].score,
    isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_COMMENT].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parsePullRequestReviewThreadComment: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_REVIEW_THREAD_COMMENT,
    sourceId: data.id,
    sourceParentId: data.pullRequest.id,
    timestamp: new Date(data.createdAt).toISOString(),
    body: data.bodyText,
    url: data.url,
    channel: apiData.repo.url,
    title: '',
    attributes: {
      state: data.pullRequest.state.toLowerCase(),
      additions: data.pullRequest.additions,
      deletions: data.pullRequest.deletions,
      changedFiles: data.pullRequest.changedFiles,
      authorAssociation: data.pullRequest.authorAssociation,
      labels: data.pullRequest.labels?.nodes.map((l) => l.name),
    },
    member,
    score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_THREAD_COMMENT].score,
    isContribution:
      GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEW_THREAD_COMMENT].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parseIssueComment: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.ISSUE_COMMENT,
    sourceId: data.id,
    sourceParentId: data.issue.id,
    timestamp: new Date(data.createdAt).toISOString(),
    url: data.url,
    body: data.bodyText,
    channel: apiData.repo.url,
    member,
    score: GITHUB_GRID[GithubActivityType.ISSUE_COMMENT].score,
    isContribution: GITHUB_GRID[GithubActivityType.ISSUE_COMMENT].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parseDiscussionComment: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const memberData = apiData.member
  const sourceParentId = apiData.sourceParentId

  const member = parseMember(memberData)

  const subType = apiData.subType

  let activity: IActivityData

  if (subType === GithubActivitySubType.DISCUSSION_COMMENT_START) {
    activity = {
      type: GithubActivityType.DISCUSSION_COMMENT,
      sourceId: data.id,
      sourceParentId: data.discussion.id,
      timestamp: new Date(data.createdAt).toISOString(),
      url: data.url,
      body: data.bodyText,
      channel: apiData.repo.url,
      attributes: {
        isAnswer: data.isAnswer ?? undefined,
      },
      member,
      score: data.isAnswer
        ? GITHUB_GRID[GithubActivityType.DISCUSSION_COMMENT].score + 2
        : GITHUB_GRID[GithubActivityType.DISCUSSION_COMMENT].score,
      isContribution: GITHUB_GRID[GithubActivityType.DISCUSSION_COMMENT].isContribution,
    }
  } else if (subType === GithubActivitySubType.DISCUSSION_COMMENT_REPLY) {
    activity = {
      type: GithubActivityType.DISCUSSION_COMMENT,
      sourceId: data.id,
      sourceParentId,
      timestamp: new Date(data.createdAt).toISOString(),
      url: data.url,
      body: data.bodyText,
      channel: apiData.repo.url,
      member,
      score: GITHUB_GRID[GithubActivityType.DISCUSSION_COMMENT].score,
      isContribution: GITHUB_GRID[GithubActivityType.DISCUSSION_COMMENT].isContribution,
    }
  }

  await ctx.publishActivity(activity)
}

const parseAuthoredCommit: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    channel: apiData.repo.url,
    url: `${apiData.repo.url}/commit/${data.commit.oid}`,
    body: data.commit.message,
    type: 'authored-commit',
    sourceId: data.commit.oid,
    sourceParentId: `${data.repository.pullRequest.id}`,
    timestamp: new Date(data.commit.authoredDate).toISOString(),
    attributes: {
      insertions: 'additions' in data.commit ? data.commit.additions : 0,
      deletions: 'deletions' in data.commit ? data.commit.deletions : 0,
      lines:
        'additions' in data.commit && 'deletions' in data.commit
          ? data.commit.additions - data.commit.deletions
          : 0,
      isMerge: data.commit.parents.totalCount > 1,
    },
    member,
    score: GITHUB_GRID[GithubActivityType.AUTHORED_COMMIT].score,
  }

  await ctx.publishActivity(activity)
}

const parseWebhookIssue = async (ctx: IProcessDataContext) => {
  const data = ctx.data as GithubWebhookData
  const payload = data.data
  const memberData = data.member

  const member = parseMember(memberData)

  let type: GithubActivityType
  let scoreGrid: IActivityScoringGrid
  let timestamp: string
  let sourceId: string
  let sourceParentId: string
  let body = ''
  let title = ''

  switch (payload.action) {
    case 'edited':
    case 'opened':
    case 'reopened':
      type = GithubActivityType.ISSUE_OPENED
      scoreGrid = GITHUB_GRID[GithubActivityType.ISSUE_OPENED]
      timestamp = payload.issue.created_at
      sourceParentId = null
      sourceId = payload.issue.node_id.toString()
      body = payload.issue.body
      title = payload.issue.title
      break

    case 'closed':
      type = GithubActivityType.ISSUE_CLOSED
      scoreGrid = GITHUB_GRID[GithubActivityType.ISSUE_CLOSED]
      timestamp = payload.issue.closed_at
      sourceParentId = payload.issue.node_id.toString()
      sourceId = `gen-CE_${payload.issue.node_id.toString()}_${payload.sender.login}_${new Date(
        payload.issue.closed_at,
      ).toISOString()}`
      break

    default:
      return
  }

  const issue = payload.issue

  if (member) {
    const activity: IActivityData = {
      member,
      type,
      timestamp: new Date(timestamp).toISOString(),
      sourceId,
      sourceParentId,
      url: issue.html_url,
      title,
      channel: payload.repository.html_url,
      body,
      attributes: {
        state: issue.state,
      },
      score: scoreGrid.score,
      isContribution: scoreGrid.isContribution,
    }

    await ctx.publishActivity(activity)
  }
}

const handler: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as any

  const event = data?.type as GithubActivityType
  const webhookEvent = data?.webhookType as GithubWehookEvent

  if (event) {
    // parse github api data
    switch (event) {
      case GithubActivityType.STAR:
        await parseStar(ctx)
        break
      case GithubActivityType.FORK:
        await parseFork(ctx)
        break
      case GithubActivityType.PULL_REQUEST_OPENED:
        await parsePullRequestOpened(ctx)
        break
      case GithubActivityType.PULL_REQUEST_CLOSED:
        await parsePullRequestClosed(ctx)
        break
      case GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED:
        await parsePullRequestReviewRequested(ctx)
        break
      case GithubActivityType.PULL_REQUEST_REVIEWED:
        await parsePullRequestReviewed(ctx)
        break
      case GithubActivityType.PULL_REQUEST_ASSIGNED:
        await parsePullRequestAssigned(ctx)
        break
      case GithubActivityType.PULL_REQUEST_MERGED:
        await parsePullRequestMerged(ctx)
        break
      case GithubActivityType.ISSUE_OPENED:
        await parseIssueOpened(ctx)
        break
      case GithubActivityType.ISSUE_CLOSED:
        await parseIssueClosed(ctx)
        break
      case GithubActivityType.PULL_REQUEST_COMMENT:
        await parsePullRequestComment(ctx)
        break
      case GithubActivityType.PULL_REQUEST_REVIEW_THREAD_COMMENT:
        await parsePullRequestReviewThreadComment(ctx)
        break
      case GithubActivityType.ISSUE_COMMENT:
        await parseIssueComment(ctx)
        break
      case GithubActivityType.DISCUSSION_COMMENT:
        await parseDiscussionComment(ctx)
        break
      case GithubActivityType.AUTHORED_COMMIT:
        await parseAuthoredCommit(ctx)
        break
      default:
        await ctx.abortWithError(`Event not supported '${event}'!`)
    }
  } else if (webhookEvent) {
    // TODO: implement webhook events
    switch (webhookEvent) {
      case GithubWehookEvent.ISSUES:
        await parseWebhookIssue(ctx)
        break
      case GithubWehookEvent.DISCUSSION:
        // await parseWebhookDiscussion(ctx)
        break
      case GithubWehookEvent.PULL_REQUEST:
        // await parseWebhookPullRequest(ctx)
        break
      case GithubWehookEvent.PULL_REQUEST_REVIEW:
        // await parseWebhookPullRequestReview(ctx)
        break
      case GithubWehookEvent.STAR:
        // await parseWebhookStar(ctx)
        break
      case GithubWehookEvent.FORK:
        // await parseWebhookFork(ctx)
        break
      case GithubWehookEvent.DISCUSSION_COMMENT:
        // await parseWebhookDiscussionComment(ctx)
        break
      case GithubWehookEvent.PULL_REQUEST_REVIEW_COMMENT:
        // await parseWebhookPullRequestReviewComment(ctx)
        break
      case GithubWehookEvent.ISSUE_COMMENT:
        // await parseWebhookIssueComment(ctx)
        break
      default:
        await ctx.abortWithError(`Webhook event not supported '${webhookEvent}'!`)
    }
  }
}

export default handler
