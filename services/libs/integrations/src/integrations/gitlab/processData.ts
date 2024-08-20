import { ProcessDataHandler } from '../../types'
import { GitlabActivityType, GitlabApiData } from './types'
import {
  IActivityData,
  IMemberData,
  PlatformType,
  MemberIdentityType,
  MemberAttributeName,
} from '@crowd/types'
import { GITLAB_GRID } from './grid'
import {
  ProjectSchema,
  ProjectStarrerSchema,
  CommitSchema,
  IssueSchema,
  MergeRequestSchema,
  UserSchema,
  IssueNoteSchema,
  DiscussionNoteSchema,
  MergeRequestNoteSchema,
} from '@gitbeaker/rest'
import { generateSourceIdHash } from '../../helpers'

const parseUser = ({ data }: { data: UserSchema }): IMemberData => {
  const member: IMemberData = {
    identities: [
      {
        platform: PlatformType.GITLAB,
        value: data.username as string,
        type: MemberIdentityType.USERNAME,
        verified: true,
      },
    ],
    displayName: data.name,
    attributes: {
      [MemberAttributeName.URL]: {
        [PlatformType.GITLAB]: data.web_url || '',
      },
      [MemberAttributeName.AVATAR_URL]: {
        [PlatformType.GITLAB]: data.avatar_url || '',
      },
    },
  }

  if (data.bot) {
    member.attributes[MemberAttributeName.IS_BOT] = {
      [PlatformType.GITLAB]: true,
    }
  }

  return member
}

const parseIssueOpened = ({
  data,
  user,
  pathWithNamespace,
}: {
  data: IssueSchema
  projectId: string
  user: IMemberData
  pathWithNamespace: string
}): IActivityData => {
  return {
    type: GitlabActivityType.ISSUE_OPENED,
    member: user,
    timestamp: new Date(data.created_at).toISOString(),
    sourceId: data.id.toString(),
    url: data.web_url,
    title: data.title,
    body: data.description,
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: GITLAB_GRID[GitlabActivityType.ISSUE_OPENED].score,
    isContribution: GITLAB_GRID[GitlabActivityType.ISSUE_OPENED].isContribution,
  }
}

const parseIssueClosed = ({
  data,
  user,
  pathWithNamespace,
}: {
  data: IssueSchema
  projectId: string
  user: IMemberData
  pathWithNamespace: string
}): IActivityData => {
  return {
    type: GitlabActivityType.ISSUE_CLOSED,
    member: user,
    timestamp: new Date(data.closed_at).toISOString(),
    // GITLAB_ISSUE_CLOSED
    sourceId: `gen-GLIC_${data.id}_${user.identities[0].value}_${new Date(
      data.closed_at,
    ).toISOString()}`,
    sourceParentId: data.id.toString(),
    url: data.web_url,
    title: data.title,
    body: data.description,
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: GITLAB_GRID[GitlabActivityType.ISSUE_CLOSED].score,
    isContribution: GITLAB_GRID[GitlabActivityType.ISSUE_CLOSED].isContribution,
  }
}

const parseIssueComment = ({
  data,
  user,
  pathWithNamespace,
}: {
  data: IssueNoteSchema | DiscussionNoteSchema
  projectId: string
  user: IMemberData
  pathWithNamespace: string
}): IActivityData => {
  return {
    type: GitlabActivityType.ISSUE_COMMENT,
    member: user,
    timestamp: new Date(data.created_at).toISOString(),
    // GITLAB_ISSUE_CLOSED
    sourceId: data.id.toString(),
    sourceParentId: data.noteable_id.toString(),
    body: data.body,
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: GITLAB_GRID[GitlabActivityType.ISSUE_COMMENT].score,
    isContribution: GITLAB_GRID[GitlabActivityType.ISSUE_COMMENT].isContribution,
  }
}

const parseMergeRequestOpened = ({
  data,
  user,
  pathWithNamespace,
}: {
  data: MergeRequestSchema
  projectId: string
  user: IMemberData
  pathWithNamespace: string
}): IActivityData => {
  return {
    type: GitlabActivityType.MERGE_REQUEST_OPENED,
    member: user,
    timestamp: new Date(data.created_at).toISOString(),
    sourceId: data.id.toString(),
    url: data.web_url,
    title: data.title,
    body: data.description,
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_OPENED].score,
    isContribution: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_OPENED].isContribution,
  }
}

const parseMergeRequestClosed = ({
  data,
  user,
  pathWithNamespace,
}: {
  data: MergeRequestSchema
  projectId: string
  user: IMemberData
  pathWithNamespace: string
}): IActivityData => {
  return {
    type: GitlabActivityType.MERGE_REQUEST_CLOSED,
    member: user,
    timestamp: new Date(data.closed_at).toISOString(),
    // GITLAB_MERGE_REQUEST_CLOSED
    sourceId: `gen-GLMRC_${data.id}_${user.identities[0].value}_${new Date(
      data.closed_at,
    ).toISOString()}`,
    sourceParentId: data.id.toString(),
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_CLOSED].score,
    isContribution: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_CLOSED].isContribution,
  }
}

const parseMergeRequestMerged = ({
  data,
  user,
  pathWithNamespace,
}: {
  data: MergeRequestSchema
  projectId: string
  user: IMemberData
  pathWithNamespace: string
}): IActivityData => {
  return {
    type: GitlabActivityType.MERGE_REQUEST_MERGED,
    member: user,
    timestamp: new Date(data.merged_at).toISOString(),
    // GITLAB_MERGE_REQUEST_MERGED
    sourceId: `gen-GLMRM_${data.id}_${user.identities[0].value}_${new Date(
      data.merged_at,
    ).toISOString()}`,
    sourceParentId: data.id.toString(),
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_MERGED].score,
    isContribution: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_MERGED].isContribution,
  }
}

const parseMergeRequestComment = ({
  data,
  user,
  pathWithNamespace,
}: {
  data: MergeRequestNoteSchema | DiscussionNoteSchema
  projectId: string
  user: IMemberData
  pathWithNamespace: string
}): IActivityData => {
  return {
    type: GitlabActivityType.MERGE_REQUEST_COMMENT,
    member: user,
    timestamp: new Date(data.created_at).toISOString(),
    body: data.body,
    sourceId: data.id.toString(),
    sourceParentId: data.noteable_id.toString(),
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_COMMENT].score,
    isContribution: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_COMMENT].isContribution,
  }
}

const parseStar = ({
  data,
  user,
  pathWithNamespace,
}: {
  data: ProjectStarrerSchema
  projectId: string
  user: IMemberData
  pathWithNamespace: string
}): IActivityData => {
  return {
    type: GitlabActivityType.STAR,
    member: user,
    timestamp: new Date(data.starred_since).toISOString(),
    sourceId: generateSourceIdHash(
      data.user.id.toString(),
      GitlabActivityType.STAR,
      data.starred_since,
      PlatformType.GITLAB,
    ),
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: GITLAB_GRID[GitlabActivityType.STAR].score,
    isContribution: GITLAB_GRID[GitlabActivityType.STAR].isContribution,
  }
}

const parseFork = ({
  data,
  projectId,
  user,
  pathWithNamespace,
}: {
  data: ProjectSchema
  projectId: string
  user: IMemberData
  pathWithNamespace: string
}): IActivityData => {
  return {
    type: GitlabActivityType.FORK,
    member: user,
    timestamp: new Date(data.created_at).toISOString(),
    sourceId: data.id.toString(),
    sourceParentId: projectId,
    url: data.web_url,
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: GITLAB_GRID[GitlabActivityType.FORK].score,
    isContribution: GITLAB_GRID[GitlabActivityType.FORK].isContribution,
  }
}

const handler: ProcessDataHandler = async (ctx) => {
  const apiData = ctx.data as GitlabApiData<any>
  const {
    type,
    data: { data, user },
    projectId,
    pathWithNamespace,
  } = apiData

  let activity: IActivityData

  const member = parseUser({
    data: user,
  })
  switch (type) {
    case GitlabActivityType.ISSUE_OPENED:
      activity = parseIssueOpened({
        data: data as IssueSchema,
        projectId,
        user: member,
        pathWithNamespace,
      })
      break
    case GitlabActivityType.ISSUE_CLOSED:
      activity = parseIssueClosed({
        data: data as IssueSchema,
        projectId,
        user: member,
        pathWithNamespace,
      })
      break
    case GitlabActivityType.ISSUE_COMMENT:
      activity = parseIssueComment({
        data: data as IssueNoteSchema,
        projectId,
        user: member,
        pathWithNamespace,
      })
      break
    case GitlabActivityType.MERGE_REQUEST_OPENED:
      activity = parseMergeRequestOpened({
        data: data as MergeRequestSchema,
        projectId,
        user: member,
        pathWithNamespace,
      })
      break
    case GitlabActivityType.MERGE_REQUEST_CLOSED:
      activity = parseMergeRequestClosed({
        data: data as MergeRequestSchema,
        projectId,
        user: member,
        pathWithNamespace,
      })
      break
    case GitlabActivityType.MERGE_REQUEST_COMMENT:
      activity = parseMergeRequestComment({
        data: data as MergeRequestNoteSchema,
        projectId,
        user: member,
        pathWithNamespace,
      })
      break
    case GitlabActivityType.MERGE_REQUEST_MERGED:
      activity = parseMergeRequestMerged({
        data: data as MergeRequestSchema,
        projectId,
        user: member,
        pathWithNamespace,
      })
      break
    case GitlabActivityType.STAR:
      activity = parseStar({
        data: data as ProjectStarrerSchema,
        projectId,
        user: member,
        pathWithNamespace,
      })
      break
    case GitlabActivityType.FORK:
      activity = parseFork({
        data: data as ProjectSchema,
        projectId,
        user: member,
        pathWithNamespace,
      })
      break
    default:
      throw new Error(`Unsupported activity type: ${type}`)
  }

  await ctx.publishActivity(activity)
}

export default handler
