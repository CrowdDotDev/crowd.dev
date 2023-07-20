// processData.ts content
import { IProcessStreamContext, ProcessDataHandler } from '../../types'
import { GithubApiData, GithubActivityType, GithubParseMemberOutput } from './types'
import { IActivityData, IMemberData, PlatformType, MemberAttributeName } from '@crowd/types'
import { GITHUB_GRID } from './grid'
import { generateSourceIdHash } from '@/helpers'

const IS_TEST_ENV: boolean = process.env.NODE_ENV === 'test'

const parseMember = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  memberFromApi: any,
  memberAdditionalInfo: GithubParseMemberOutput,
): IMemberData => {
  const { email, orgs } = memberAdditionalInfo

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
  const memberAdditionalInfo = apiData.member

  const member = parseMember(data.node, memberAdditionalInfo)

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
  const memberAdditionalInfo = apiData.member

  const member = parseMember(data.owner, memberAdditionalInfo)

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

const parsePullRequestOpened: ProcessDataHandler = async (ctx) => {}

const parsePullRequestClosed: ProcessDataHandler = async (ctx) => {}

const parsePullRequestReviewRequested: ProcessDataHandler = async (ctx) => {}

const parsePullRequestReviewed: ProcessDataHandler = async (ctx) => {}

const parsePullRequestAssigned: ProcessDataHandler = async (ctx) => {}

const parsePullRequestMerged: ProcessDataHandler = async (ctx) => {}

const parseIssueOpened: ProcessDataHandler = async (ctx) => {}

const parseIssueClosed: ProcessDataHandler = async (ctx) => {}

const parsePullRequestComment: ProcessDataHandler = async (ctx) => {}

const parsePullRequestReviewThreadComment: ProcessDataHandler = async (ctx) => {}

const parseIssueComment: ProcessDataHandler = async (ctx) => {}

const parseDiscussionComment: ProcessDataHandler = async (ctx) => {}

const parseAuthoredCommit: ProcessDataHandler = async (ctx) => {}

const handler: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as GithubApiData

  const event = data.type

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
      throw new Error(`Event not supported '${event}'!`)
  }
}

export default handler
