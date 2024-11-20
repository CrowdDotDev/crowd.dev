/* eslint-disable  @typescript-eslint/no-explicit-any */
// processStream.ts content
// processData.ts content
import {
  type IGetRepoForksResult,
  type IGetRepoIssueCommentsResult,
  type IGetRepoIssuesResult,
  type IGetRepoPullRequestReviewCommentsResult,
  type IGetRepoPullRequestReviewsResult,
  type IGetRepoPullRequestsResult,
  type IGetRepoPushesResult,
  type IGetRepoStargazersResult,
} from '@crowd/snowflake'
import {
  IActivityData,
  IMemberData,
  IOrganization,
  MemberAttributeName,
  MemberIdentityType,
  OrganizationIdentityType,
  OrganizationSource,
  PlatformType,
} from '@crowd/types'

import { generateSourceIdHash } from '../../helpers'
import { ProcessDataHandler } from '../../types'

import { GITHUB_GRID } from './grid'
import {
  GithubActivityType,
  GithubApiData,
  GithubPrepareMemberOutput,
  GithubPrepareOrgMemberOutput,
  INDIRECT_FORK,
} from './types'

const IS_TEST_ENV: boolean = process.env.NODE_ENV === 'test'

const parseBotMember = (memberData: GithubPrepareMemberOutput): IMemberData => {
  const member: IMemberData = {
    identities: [
      {
        platform: PlatformType.GITHUB,
        value: memberData.memberFromApi.login,
        type: MemberIdentityType.USERNAME,
        verified: true,
      },
    ],
    displayName: memberData.memberFromApi.login,
    attributes: {
      [MemberAttributeName.URL]: {
        [PlatformType.GITHUB]: memberData.memberFromApi?.url || '',
      },
      [MemberAttributeName.AVATAR_URL]: {
        [PlatformType.GITHUB]: memberData.memberFromApi?.avatarUrl || '',
      },
      [MemberAttributeName.SOURCE_ID]: {
        [PlatformType.GITHUB]: memberData.memberFromApi?.id?.toString() || '',
      },
      [MemberAttributeName.IS_BOT]: {
        [PlatformType.GITHUB]: true,
      },
    },
  }

  return member
}

const parseDeletedMember = (memberData: GithubPrepareMemberOutput): IMemberData => {
  const member: IMemberData = {
    identities: [
      {
        platform: PlatformType.GITHUB,
        value: memberData.memberFromApi.login,
        type: MemberIdentityType.USERNAME,
        verified: true,
      },
    ],
    displayName: 'Deleted User',
    attributes: {
      [MemberAttributeName.URL]: {
        [PlatformType.GITHUB]: memberData.memberFromApi?.url || '',
      },
      [MemberAttributeName.AVATAR_URL]: {
        [PlatformType.GITHUB]: memberData.memberFromApi?.avatarUrl || '',
      },
      [MemberAttributeName.BIO]: {
        [PlatformType.GITHUB]:
          "Hi, I'm @ghost! I take the place of user accounts that have been deleted. :ghost:",
      },
    },
  }

  return member
}

const parseMember = (memberData: GithubPrepareMemberOutput): IMemberData => {
  const { email, org, memberFromApi } = memberData

  if (memberFromApi.isBot && memberFromApi.isDeleted) {
    throw new Error('Member cannot be both bot and deleted')
  }

  if (memberFromApi.isBot) {
    return parseBotMember(memberData)
  }

  if (memberFromApi.isDeleted) {
    return parseDeletedMember(memberData)
  }

  const member: IMemberData = {
    identities: [
      {
        platform: PlatformType.GITHUB,
        value: memberFromApi.login,
        type: MemberIdentityType.USERNAME,
        sourceId: memberFromApi.id.toString(),
        verified: true,
      },
    ],
    displayName: memberFromApi?.name?.trim() || memberFromApi.login,
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
      [MemberAttributeName.COMPANY]: {
        [PlatformType.GITHUB]: memberFromApi.company || '',
      },
    },
  }

  if (email) {
    member.identities.push({
      platform: PlatformType.GITHUB,
      value: email,
      type: MemberIdentityType.EMAIL,
      verified: true,
    })
  }

  if (memberFromApi?.twitterUsername) {
    member.identities.push({
      platform: PlatformType.TWITTER,
      value: memberFromApi.twitterUsername,
      type: MemberIdentityType.USERNAME,
      verified: false,
    })
  }

  if (memberFromApi.websiteUrl) {
    member.attributes[MemberAttributeName.WEBSITE_URL] = {
      [PlatformType.GITHUB]: memberFromApi.websiteUrl,
    }
  }

  if (memberFromApi.company) {
    if (IS_TEST_ENV) {
      member.organizations = [
        {
          attributes: {
            name: {
              integration: ['crowd.dev'],
            },
          },
          identities: [
            {
              value: 'crowd.dev',
              platform: PlatformType.GITHUB,
              type: OrganizationIdentityType.USERNAME,
              verified: true,
            },
          ],
          source: OrganizationSource.GITHUB,
        },
      ]
    } else {
      const company = memberFromApi.company.replace('@', '').trim()

      if (org && company.length > 0) {
        const organizationPayload: IOrganization = {
          displayName: org.login,
          identities: [
            {
              platform: PlatformType.GITHUB,
              type: OrganizationIdentityType.USERNAME,
              value: org.login,
              verified: true,
            },
          ],
          logo: org.avatarUrl ?? null,
          source: OrganizationSource.GITHUB,
        }

        member.organizations = [organizationPayload]
      }
    }
  }

  return member
}

const parseOrgMember = (memberData: GithubPrepareOrgMemberOutput): IMemberData => {
  const { orgFromApi } = memberData

  const member: IMemberData = {
    identities: [
      {
        platform: PlatformType.GITHUB,
        value: orgFromApi.login,
        type: MemberIdentityType.USERNAME,
        verified: true,
      },
    ],
    displayName: orgFromApi?.name?.trim() || orgFromApi.login,
    attributes: {
      [MemberAttributeName.URL]: {
        [PlatformType.GITHUB]: orgFromApi.url,
      },
      [MemberAttributeName.BIO]: {
        [PlatformType.GITHUB]: orgFromApi.description || '',
      },
      [MemberAttributeName.LOCATION]: {
        [PlatformType.GITHUB]: orgFromApi.location || '',
      },
      [MemberAttributeName.AVATAR_URL]: {
        [PlatformType.GITHUB]: orgFromApi.avatarUrl || '',
      },
    },
  }

  if (orgFromApi.email) {
    member.identities.push({
      platform: PlatformType.GITHUB,
      value: orgFromApi.email,
      type: MemberIdentityType.EMAIL,
      verified: true,
    })
  }

  if (orgFromApi?.twitterUsername) {
    member.identities.push({
      platform: PlatformType.TWITTER,
      value: orgFromApi.twitterUsername,
      type: MemberIdentityType.USERNAME,
      verified: false,
    })
  }

  if (orgFromApi.websiteUrl) {
    member.attributes[MemberAttributeName.WEBSITE_URL] = {
      [PlatformType.GITHUB]: orgFromApi.websiteUrl,
    }
  }

  // mark as organization
  member.attributes[MemberAttributeName.IS_ORGANIZATION] = {
    [PlatformType.GITHUB]: true,
  }

  return member
}

const parseStar: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data as IGetRepoStargazersResult
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.STAR,
    sourceId: generateSourceIdHash(
      data.actorLogin,
      GithubActivityType.STAR,
      Math.floor(new Date(data.timestamp).getTime() / 1000).toString(),
      PlatformType.GITHUB,
    ),
    sourceParentId: '',
    timestamp: new Date(data.timestamp).toISOString(),
    channel: apiData.repo.url,
    member,
    score: GITHUB_GRID.star.score,
    isContribution: GITHUB_GRID.star.isContribution,
  }

  await ctx.publishActivity(activity)
}

const parseFork: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData

  // if (apiData.orgMember && !apiData.member) {
  //   await parseForkByOrg(ctx)
  //   return
  // } else if (apiData.member && apiData.orgMember) {
  //   throw new Error('Both member and orgMember are present')
  // } else if (!apiData.member && !apiData.orgMember) {
  //   throw new Error('Both member and orgMember are missing')
  // }

  const data = apiData.data as IGetRepoForksResult
  // const relatedData = apiData.relatedData
  const memberData = apiData.member
  // const subType = apiData.subType

  const member = parseMember(memberData)

  // if (subType && subType === INDIRECT_FORK) {
  //   const activity: IActivityData = {
  //     type: GithubActivityType.FORK,
  //     sourceId: data.id,
  //     sourceParentId: '',
  //     timestamp: new Date(data.createdAt).toISOString(),
  //     channel: apiData.repo.url,
  //     member,
  //     score: GITHUB_GRID.fork.score,
  //     isContribution: GITHUB_GRID.fork.isContribution,
  //     attributes: {
  //       isIndirectFork: true,
  //       directParent: relatedData.url,
  //     },
  //   }

  //   await ctx.publishActivity(activity)
  //   return
  // }

  const activity: IActivityData = {
    type: GithubActivityType.FORK,
    sourceId: data.payload.forkee.node_id,
    sourceParentId: '',
    timestamp: new Date(data.timestamp).toISOString(),
    channel: apiData.repo.url,
    member,
    score: GITHUB_GRID.fork.score,
    isContribution: GITHUB_GRID.fork.isContribution,
  }

  await ctx.publishActivity(activity)
}

const parseForkByOrg: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const relatedData = apiData.relatedData
  const memberData = apiData.orgMember
  const subType = apiData.subType

  const member = parseOrgMember(memberData)

  if (subType && subType === INDIRECT_FORK) {
    const activity: IActivityData = {
      type: GithubActivityType.FORK,
      sourceId: data.id,
      sourceParentId: '',
      timestamp: new Date(data.createdAt).toISOString(),
      channel: apiData.repo.url,
      member,
      score: GITHUB_GRID.fork.score,
      isContribution: GITHUB_GRID.fork.isContribution,
      attributes: {
        isIndirectFork: true,
        directParent: relatedData.url,
        isForkByOrg: true,
      },
    }

    await ctx.publishActivity(activity)
    return
  }

  const activity: IActivityData = {
    type: GithubActivityType.FORK,
    sourceId: data.id,
    sourceParentId: '',
    timestamp: new Date(data.createdAt).toISOString(),
    channel: apiData.repo.url,
    member,
    score: GITHUB_GRID.fork.score,
    isContribution: GITHUB_GRID.fork.isContribution,
    attributes: {
      isForkByOrg: true,
    },
  }

  await ctx.publishActivity(activity)
}

const parsePullRequestOpened: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data as IGetRepoPullRequestsResult
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_OPENED,
    sourceId: data.payload.pull_request.node_id,
    sourceParentId: '',
    timestamp: new Date(data.timestamp).toISOString(),
    body: data.payload.pull_request.body,
    url: data.payload.pull_request._links.html.href,
    channel: apiData.repo.url,
    title: data.payload.pull_request.title,
    attributes: {
      state: data.payload.pull_request.state.toLowerCase(),
      additions: data.payload.pull_request.additions,
      deletions: data.payload.pull_request.deletions,
      changedFiles: data.payload.pull_request.changed_files,
      authorAssociation: data.payload.pull_request.author_association,
      labels: data.payload.pull_request.labels?.map((l) => (l as any)?.name),
    },
    member,
    score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_OPENED].score,
    isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_OPENED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parsePullRequestClosed: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data as IGetRepoPullRequestsResult
  const memberData = apiData.member
  const repo = apiData.repo

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_CLOSED,
    sourceId: `gen-CE_${data.payload.pull_request.node_id}_${memberData.memberFromApi.login}_${new Date(
      data.timestamp,
    ).toISOString()}`,
    sourceParentId: data.payload.pull_request.node_id,
    timestamp: new Date(data.timestamp).toISOString(),
    body: '',
    url: data.payload.pull_request._links.html.href,
    channel: repo.url,
    title: '',
    attributes: {
      state: data.payload.pull_request.state.toLowerCase(),
      additions: data.payload.pull_request.additions,
      deletions: data.payload.pull_request.deletions,
      changedFiles: data.payload.pull_request.changed_files,
      authorAssociation: data.payload.pull_request.author_association,
      labels: data.payload.pull_request.labels?.map((l) => (l as any)?.name),
    },
    member,
    score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_CLOSED].score,
    isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_CLOSED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parsePullRequestReviewed: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data as IGetRepoPullRequestReviewsResult
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_REVIEWED,
    sourceId: `gen-PRR_${data.payload.pull_request.node_id}_${memberData.memberFromApi.login}_${new Date(
      data.timestamp,
    ).toISOString()}`,
    sourceParentId: data.payload.pull_request.node_id,
    timestamp: new Date(data.timestamp).toISOString(),
    url: data.payload.pull_request._links.html.href,
    channel: apiData.repo.url,
    body: '',
    title: '',
    attributes: {
      reviewState: data.state,
      state: data.payload.pull_request.state.toLowerCase(),
      authorAssociation: data.payload.pull_request.author_association,
      labels: data.payload.pull_request.labels?.map((l) => (l as any)?.name),
    },
    member,
    score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEWED].score,
    isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEWED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parsePullRequestMerged: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data as IGetRepoPullRequestsResult
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_MERGED,
    sourceId: `gen-ME_${data.payload.pull_request.node_id}_${memberData.memberFromApi.login}_${new Date(
      data.timestamp,
    ).toISOString()}`,
    sourceParentId: data.payload.pull_request.node_id,
    timestamp: new Date(data.timestamp).toISOString(),
    body: '',
    url: data.payload.pull_request.html_url,
    channel: apiData.repo.url,
    title: '',
    attributes: {
      state: data.payload.pull_request.state.toLowerCase(),
      additions: data.payload.pull_request.additions,
      deletions: data.payload.pull_request.deletions,
      changedFiles: data.payload.pull_request.changed_files,
      authorAssociation: data.payload.pull_request.author_association,
      labels: data.payload.pull_request.labels?.map((l) => l.name),
    },
    member,
    score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_MERGED].score,
    isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_MERGED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parseIssueOpened: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data as IGetRepoIssuesResult
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.ISSUE_OPENED,
    sourceId: data.payload.issue.node_id,
    sourceParentId: '',
    timestamp: new Date(data.timestamp).toISOString(),
    body: data.payload.issue.body,
    url: data.payload.issue.html_url,
    channel: apiData.repo.url,
    title: data.payload.issue.title,
    attributes: {
      state: data.payload.issue.state.toLowerCase(),
    },
    member,
    score: GITHUB_GRID[GithubActivityType.ISSUE_OPENED].score,
    isContribution: GITHUB_GRID[GithubActivityType.ISSUE_OPENED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parseIssueClosed: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data as IGetRepoIssuesResult
  const memberData = apiData.member
  const repo = apiData.repo

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.ISSUE_CLOSED,
    sourceId: `gen-CE_${data.payload.issue.node_id}_${memberData.memberFromApi.login}_${new Date(
      data.timestamp,
    ).toISOString()}`,
    sourceParentId: data.payload.issue.node_id,
    timestamp: new Date(data.timestamp).toISOString(),
    body: '',
    url: data.payload.issue.html_url,
    channel: repo.url,
    title: '',
    attributes: {
      state: data.payload.issue.state.toLowerCase(),
    },
    member,
    score: GITHUB_GRID[GithubActivityType.ISSUE_CLOSED].score,
    isContribution: GITHUB_GRID[GithubActivityType.ISSUE_CLOSED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parsePullRequestComment: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data as IGetRepoPullRequestReviewCommentsResult
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_COMMENT,
    sourceId: data.payload.comment.node_id,
    sourceParentId: data.payload.pull_request.node_id,
    timestamp: new Date(data.timestamp).toISOString(),
    url: data.payload.comment._links.html.href,
    body: data.payload.comment.body,
    channel: apiData.repo.url,
    member,
    score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_COMMENT].score,
    isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_COMMENT].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parseIssueComment: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data as IGetRepoIssueCommentsResult
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.ISSUE_COMMENT,
    sourceId: data.payload.comment.node_id,
    sourceParentId: data.payload.issue.node_id,
    timestamp: new Date(data.timestamp).toISOString(),
    url: data.payload.comment.html_url,
    body: data.payload.comment.body,
    channel: apiData.repo.url,
    member,
    score: GITHUB_GRID[GithubActivityType.ISSUE_COMMENT].score,
    isContribution: GITHUB_GRID[GithubActivityType.ISSUE_COMMENT].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parseAuthoredCommit: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data as IGetRepoPushesResult
  const memberData = apiData.member

  const member = parseMember(memberData)

  for (const commit of data.payload.commits) {
    const activity: IActivityData = {
      channel: apiData.repo.url,
      url: `${apiData.repo.url}/commit/${commit.sha}`,
      body: commit.message,
      type: 'authored-commit',
      sourceId: commit.sha,
      sourceParentId: '',
      timestamp: new Date(data.timestamp).toISOString(),
      // attributes: {
      //   insertions: 'additions' in data.commit ? data.commit.additions : 0,
      //   deletions: 'deletions' in data.commit ? data.commit.deletions : 0,
      //   lines:
      //     'additions' in data.commit && 'deletions' in data.commit
      //       ? data.commit.additions - data.commit.deletions
      //       : 0,
      //   isMerge: data.commit.parents.totalCount > 1,
      // },
      member,
      score: GITHUB_GRID[GithubActivityType.AUTHORED_COMMIT].score,
      isContribution: GITHUB_GRID[GithubActivityType.AUTHORED_COMMIT].isContribution,
    }

    await ctx.publishActivity(activity)
  }
}

const handler: ProcessDataHandler = async (ctx) => {
  const data = ctx.data as any

  const event = data?.type as GithubActivityType

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
      case GithubActivityType.PULL_REQUEST_COMMENT:
        await parsePullRequestComment(ctx)
        break
      case GithubActivityType.PULL_REQUEST_REVIEWED:
        await parsePullRequestReviewed(ctx)
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
      case GithubActivityType.ISSUE_COMMENT:
        await parseIssueComment(ctx)
        break
      case GithubActivityType.AUTHORED_COMMIT:
        await parseAuthoredCommit(ctx)
        break
      default:
        await ctx.abortWithError(`Event not supported '${event}'!`)
    }
  } else {
    await ctx.abortWithError('No event type found in data!')
  }
}

export default handler
