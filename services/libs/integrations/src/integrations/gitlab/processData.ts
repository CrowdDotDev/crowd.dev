import { ProcessDataHandler } from '../../types'
import { GitlabActivityType, GitlabApiData } from './types'
import { IActivityData, IMemberData, PlatformType, MemberIdentityType } from '@crowd/types'
import { GITLAB_GRID } from './grid'
import {
  ProjectSchema,
  ProjectStarrerSchema,
  CommitSchema,
  IssueSchema,
  MergeRequestSchema,
  UserSchema,
  IssueNoteSchema,
} from '@gitbeaker/rest'
import { generateSourceIdHash } from '../../helpers'

const parseUser = ({ data }: { data: UserSchema }): IMemberData => {
  return {
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
      name: data.name,
      avatar: data.avatar_url,
      url: data.web_url,
    },
  }
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
  data: IssueNoteSchema
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
    sourceId: data.id.toString(),
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_CLOSED].score,
    isContribution: GITLAB_GRID[GitlabActivityType.MERGE_REQUEST_CLOSED].isContribution,
  }
}

const parseCommit = ({
  data,
  projectId,
  user,
  pathWithNamespace,
}: {
  data: CommitSchema
  projectId: string
  user: IMemberData
  pathWithNamespace: string
}): IActivityData => {
  return {
    type: GitlabActivityType.AUTHORED_COMMIT,
    member: user,
    timestamp: new Date(data.created_at).toISOString(),
    sourceId: data.id,
    sourceParentId: projectId,
    url: data.web_url,
    title: data.title,
    body: data.message,
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: GITLAB_GRID[GitlabActivityType.AUTHORED_COMMIT].score,
    isContribution: GITLAB_GRID[GitlabActivityType.AUTHORED_COMMIT].isContribution,
  }
}

const parseDiscussion = ({
  data,
  projectId,
  member,
  pathWithNamespace,
}: {
  data: any
  projectId: string
  member: IMemberData
  pathWithNamespace: string
}): IActivityData => {
  return {
    type: GitlabActivityType.DISCUSSION_STARTED,
    member,
    timestamp: new Date(data.created_at).toISOString(),
    sourceId: data.id,
    sourceParentId: projectId,
    url: data.web_url,
    title: '',
    body: data.notes[0].body,
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: GITLAB_GRID[GitlabActivityType.DISCUSSION_STARTED].score,
    isContribution: GITLAB_GRID[GitlabActivityType.DISCUSSION_STARTED].isContribution,
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
