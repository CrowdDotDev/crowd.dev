/* eslint-disable  @typescript-eslint/no-explicit-any */
// processStream.ts content
// processData.ts content
import { type IGetRepoPullRequestsResult } from '@crowd/snowflake'
import {
  IActivityData,
  IActivityScoringGrid,
  IMemberData,
  IOrganization,
  MemberAttributeName,
  MemberIdentityType,
  OrganizationIdentityType,
  OrganizationSource,
  PlatformType,
} from '@crowd/types'

import { generateSourceIdHash } from '../../helpers'
import { IProcessDataContext, ProcessDataHandler } from '../../types'

import { GITHUB_GRID } from './grid'
import {
  GithubActivitySubType,
  GithubActivityType,
  GithubApiData,
  GithubIssue,
  GithubIssueTimelineItem,
  GithubPrepareMemberOutput,
  GithubPrepareOrgMemberOutput,
  GithubPullRequest,
  GithubPullRequestTimelineItem,
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
  const { email, orgs, memberFromApi } = memberData

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

      if (orgs && company.length > 0) {
        const organizationPayload = {
          displayName: orgs.name,
          names: [orgs.name],
          identities: [
            {
              platform: PlatformType.GITHUB,
              type: OrganizationIdentityType.USERNAME,
              value: orgs.url.replace('https://github.com/', ''),
              verified: true,
            },
          ],
          description: orgs.description ?? null,
          location: orgs.location ?? null,
          logo: orgs.avatarUrl ?? null,
          source: OrganizationSource.GITHUB,
        } as IOrganization

        if (orgs.websiteUrl) {
          organizationPayload.identities.push({
            platform: PlatformType.GITHUB,
            type: OrganizationIdentityType.PRIMARY_DOMAIN,
            value: orgs.websiteUrl,
            verified: false,
          })
        }

        if (orgs.twitterUsername) {
          organizationPayload.identities.push({
            platform: PlatformType.TWITTER,
            type: OrganizationIdentityType.USERNAME,
            value: orgs.twitterUsername,
            verified: false,
          })
        }

        member.organizations = [organizationPayload]
      }
    }
  }

  // if (memberFromApi.followers && memberFromApi.followers.totalCount > 0) {
  //   member.reach = { [PlatformType.GITHUB]: memberFromApi.followers.totalCount }
  // }

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

  if (apiData.orgMember && !apiData.member) {
    await parseForkByOrg(ctx)
    return
  } else if (apiData.member && apiData.orgMember) {
    throw new Error('Both member and orgMember are present')
  } else if (!apiData.member && !apiData.orgMember) {
    throw new Error('Both member and orgMember are missing')
  }

  const data = apiData.data
  const relatedData = apiData.relatedData
  const memberData = apiData.member
  const subType = apiData.subType

  const member = parseMember(memberData)

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
    sourceId: data.id.toString(),
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
    sourceId: `gen-CE_${data.id}_${memberData.memberFromApi.login}_${new Date(
      data.timestamp,
    ).toISOString()}`,
    sourceParentId: data.id.toString(),
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

const parsePullRequestReviewRequested: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data as GithubPullRequestTimelineItem
  const relatedData = apiData.relatedData as GithubPullRequest
  const memberData = apiData.member
  const objectMemberData = apiData.objectMember

  const member = parseMember(memberData)
  const objectMember = parseMember(objectMemberData)

  const subType = apiData.subType

  const sourceId =
    subType === GithubActivitySubType.PULL_REQUEST_REVIEW_REQUESTED_SINGLE
      ? `gen-RRE_${relatedData.id}_${memberData.memberFromApi.login}_${
          objectMemberData.memberFromApi.login
        }_${new Date(data.createdAt).toISOString()}`
      : `gen-RRE_${relatedData.id}_${memberData.memberFromApi.login}_${
          objectMemberData.memberFromApi.login
        }_${new Date(data.createdAt).toISOString()}`

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_REVIEW_REQUESTED,
    sourceId: sourceId,
    sourceParentId: relatedData.id,
    timestamp: new Date(data.createdAt).toISOString(),
    body: '',
    url: relatedData.url,
    channel: apiData.repo.url,
    title: '',
    attributes: {
      state: relatedData.state.toLowerCase(),
      additions: relatedData.additions,
      deletions: relatedData.deletions,
      changedFiles: relatedData.changedFiles,
      authorAssociation: relatedData.authorAssociation,
      labels: relatedData.labels?.nodes.map((l) => l.name),
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
  const data = apiData.data as GithubPullRequestTimelineItem
  const relatedData = apiData.relatedData as GithubPullRequest
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_REVIEWED,
    sourceId: `gen-PRR_${relatedData.id}_${memberData.memberFromApi.login}_${new Date(
      data.submittedAt,
    ).toISOString()}`,
    sourceParentId: relatedData.id,
    timestamp: new Date(data.submittedAt).toISOString(),
    url: relatedData.url,
    channel: apiData.repo.url,
    body: data.body,
    title: '',
    attributes: {
      reviewState: data.state,
      state: relatedData.state.toLowerCase(),
      additions: relatedData.additions,
      deletions: relatedData.deletions,
      changedFiles: relatedData.changedFiles,
      authorAssociation: relatedData.authorAssociation,
      labels: relatedData.labels,
    },
    member,
    score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEWED].score,
    isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_REVIEWED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parsePullRequestAssigned: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data as GithubPullRequestTimelineItem
  const relatedData = apiData.relatedData as GithubPullRequest
  const memberData = apiData.member
  const objectMemberData = apiData.objectMember

  const member = parseMember(memberData)
  const objectMember = parseMember(objectMemberData)

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_ASSIGNED,
    sourceId: `gen-AE_${relatedData.id}_${memberData.memberFromApi.login}_${
      objectMemberData.memberFromApi.login
    }_${new Date(data.createdAt).toISOString()}`,
    sourceParentId: relatedData.id,
    timestamp: new Date(data.createdAt).toISOString(),
    body: '',
    url: relatedData.url,
    channel: apiData.repo.url,
    title: '',
    attributes: {
      state: relatedData.state.toLowerCase(),
      additions: relatedData.additions,
      deletions: relatedData.deletions,
      changedFiles: relatedData.changedFiles,
      authorAssociation: relatedData.authorAssociation,
      labels: relatedData.labels?.nodes?.map((l) => l.name),
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
  const data = apiData.data as GithubPullRequestTimelineItem
  const relatedData = apiData.relatedData as GithubPullRequest
  const memberData = apiData.member

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.PULL_REQUEST_MERGED,
    sourceId: `gen-ME_${relatedData.id}_${memberData.memberFromApi.login}_${new Date(
      data.createdAt,
    ).toISOString()}`,
    sourceParentId: relatedData.id,
    timestamp: new Date(data.createdAt).toISOString(),
    body: '',
    url: relatedData.url,
    channel: apiData.repo.url,
    title: '',
    attributes: {
      state: relatedData.state.toLowerCase(),
      additions: relatedData.additions,
      deletions: relatedData.deletions,
      changedFiles: relatedData.changedFiles,
      authorAssociation: relatedData.authorAssociation,
      labels: relatedData.labels?.nodes.map((l) => l.name),
    },
    member,
    score: GITHUB_GRID[GithubActivityType.PULL_REQUEST_MERGED].score,
    isContribution: GITHUB_GRID[GithubActivityType.PULL_REQUEST_MERGED].isContribution,
  }

  await ctx.publishActivity(activity)
}

const parseIssueOpened: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data as GithubIssue
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
  const data = apiData.data as GithubIssueTimelineItem
  const relatedData = apiData.relatedData as GithubIssue
  const memberData = apiData.member
  const repo = apiData.repo

  const member = parseMember(memberData)

  const activity: IActivityData = {
    type: GithubActivityType.ISSUE_CLOSED,
    sourceId: `gen-CE_${relatedData.id}_${memberData.memberFromApi.login}_${new Date(
      data.createdAt,
    ).toISOString()}`,
    sourceParentId: relatedData.id,
    timestamp: new Date(data.createdAt).toISOString(),
    body: '',
    url: relatedData.url ? relatedData.url : '',
    channel: repo.url,
    title: '',
    attributes: {
      state: relatedData.state.toLowerCase(),
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

const parseAuthoredCommit: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GithubApiData
  const data = apiData.data
  const memberData = apiData.member

  const member = parseMember(memberData)
  const sourceParentId = apiData.sourceParentId // this is a pull request id

  const activity: IActivityData = {
    channel: apiData.repo.url,
    url: `${apiData.repo.url}/commit/${data.commit.oid}`,
    body: data.commit.message,
    type: 'authored-commit',
    sourceId: data.commit.oid,
    sourceParentId: `${sourceParentId}`,
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
    isContribution: GITHUB_GRID[GithubActivityType.AUTHORED_COMMIT].isContribution,
  }

  await ctx.publishActivity(activity)
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
