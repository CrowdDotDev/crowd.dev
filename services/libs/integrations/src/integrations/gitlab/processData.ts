import { ProcessDataHandler } from '../../types'
import { GitlabActivityType, GitlabApiData } from './types'
import { IActivityData, IMemberData, PlatformType, MemberIdentityType } from '@crowd/types'
import { Gitlab_GRID } from './grid'
import {
  ProjectSchema,
  ProjectStarrerSchema,
  CommitSchema,
  IssueSchema,
  MergeRequestSchema,
  UserSchema,
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

const parseIssue = ({
  data,
  projectId,
  user,
  pathWithNamespace,
}: {
  data: IssueSchema
  projectId: string
  user: IMemberData
  pathWithNamespace: string
}): IActivityData => {
  return {
    type: GitlabActivityType.ISSUE,
    member: user,
    timestamp: new Date(data.created_at).toISOString(),
    sourceId: data.id.toString(),
    sourceParentId: projectId,
    url: data.web_url,
    title: data.title,
    body: data.description,
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: Gitlab_GRID[GitlabActivityType.ISSUE].score,
    isContribution: Gitlab_GRID[GitlabActivityType.ISSUE].isContribution,
  }
}

const parseMergeRequest = ({
  data,
  projectId,
  user,
  pathWithNamespace,
}: {
  data: MergeRequestSchema
  projectId: string
  user: IMemberData
  pathWithNamespace: string
}): IActivityData => {
  return {
    type: GitlabActivityType.MERGE_REQUEST,
    member: user,
    timestamp: new Date(data.created_at).toISOString(),
    sourceId: data.id.toString(),
    sourceParentId: projectId,
    url: data.web_url,
    title: data.title,
    body: data.description,
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: Gitlab_GRID[GitlabActivityType.MERGE_REQUEST].score,
    isContribution: Gitlab_GRID[GitlabActivityType.MERGE_REQUEST].isContribution,
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
    type: GitlabActivityType.COMMIT,
    member: user,
    timestamp: new Date(data.created_at).toISOString(),
    sourceId: data.id,
    sourceParentId: projectId,
    url: data.web_url,
    title: data.title,
    body: data.message,
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: Gitlab_GRID[GitlabActivityType.COMMIT].score,
    isContribution: Gitlab_GRID[GitlabActivityType.COMMIT].isContribution,
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
    type: GitlabActivityType.DISCUSSION,
    member,
    timestamp: new Date(data.created_at).toISOString(),
    sourceId: data.id,
    sourceParentId: projectId,
    url: data.web_url,
    title: '',
    body: data.notes[0].body,
    channel: `https://gitlab.com/${pathWithNamespace}`,
    score: Gitlab_GRID[GitlabActivityType.DISCUSSION].score,
    isContribution: Gitlab_GRID[GitlabActivityType.DISCUSSION].isContribution,
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
    score: Gitlab_GRID[GitlabActivityType.STAR].score,
    isContribution: Gitlab_GRID[GitlabActivityType.STAR].isContribution,
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
    score: Gitlab_GRID[GitlabActivityType.FORK].score,
    isContribution: Gitlab_GRID[GitlabActivityType.FORK].isContribution,
  }
}

const parseMember = ({ memberData }: { memberData: any }): IMemberData => {
  return {
    identities: [
      {
        platform: PlatformType.GITLAB,
        value: memberData.username as string,
        type: MemberIdentityType.USERNAME,
        verified: true,
      },
    ],
    attributes: {
      name: memberData.name,
      avatar: memberData.avatar_url,
      url: memberData.web_url,
    },
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
    case GitlabActivityType.ISSUE:
      activity = parseIssue({
        data: data as IssueSchema,
        projectId,
        user: member,
        pathWithNamespace,
      })
      break
    case GitlabActivityType.MERGE_REQUEST:
      activity = parseMergeRequest({
        data: data as MergeRequestSchema,
        projectId,
        user: member,
        pathWithNamespace,
      })
      break
    case GitlabActivityType.COMMIT:
      activity = parseCommit({
        data: data as CommitSchema,
        projectId,
        user: member,
        pathWithNamespace,
      })
      break
    case GitlabActivityType.DISCUSSION:
      activity = parseDiscussion({
        data,
        projectId,
        member,
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
