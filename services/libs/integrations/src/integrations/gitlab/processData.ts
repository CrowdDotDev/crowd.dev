import { ProcessDataHandler } from '../../types'
import { GitlabActivityType, GitlabApiData } from './types'
import { IActivityData, IMemberData, PlatformType, MemberIdentityType } from '@crowd/types'
import { Gitlab_GRID } from './grid'
import {
  ProjectSchema,
  ProjectStarrerSchema,
  Camelize,
  CommitSchema,
  IssueSchema,
  MergeRequestSchema,
} from '@gitbeaker/rest'

const parseIssue = (data: IssueSchema, projectId: string, user: IMemberData): IActivityData => {
  return {
    type: GitlabActivityType.ISSUE,
    member: user,
    timestamp: new Date(data.created_at).toISOString(),
    sourceId: data.id.toString(),
    sourceParentId: projectId,
    url: data.web_url,
    title: data.title,
    body: data.description,
    channel: `https://gitlab.com/project/${projectId}`,
    score: Gitlab_GRID[GitlabActivityType.ISSUE].score,
    isContribution: Gitlab_GRID[GitlabActivityType.ISSUE].isContribution,
  }
}

const parseMergeRequest = (
  data: MergeRequestSchema,
  projectId: string,
  user: IMemberData,
): IActivityData => {
  return {
    type: GitlabActivityType.MERGE_REQUEST,
    member: user,
    timestamp: new Date(data.created_at).toISOString(),
    sourceId: data.id.toString(),
    sourceParentId: projectId,
    url: data.web_url,
    title: data.title,
    body: data.description,
    channel: `https://gitlab.com/project/${projectId}`,
    score: Gitlab_GRID[GitlabActivityType.MERGE_REQUEST].score,
    isContribution: Gitlab_GRID[GitlabActivityType.MERGE_REQUEST].isContribution,
  }
}

const parseCommit = (data: CommitSchema, projectId: string, user: IMemberData): IActivityData => {
  return {
    type: GitlabActivityType.COMMIT,
    member: user,
    timestamp: new Date(data.created_at).toISOString(),
    sourceId: data.id,
    sourceParentId: projectId,
    url: data.web_url,
    title: data.title,
    body: data.message,
    channel: `https://gitlab.com/project/${projectId}`,
    score: Gitlab_GRID[GitlabActivityType.COMMIT].score,
    isContribution: Gitlab_GRID[GitlabActivityType.COMMIT].isContribution,
  }
}

const parseDiscussion = (data: any, projectId: string): IActivityData[] => {
  return [
    {
      type: GitlabActivityType.DISCUSSION,
      member,
      timestamp: new Date(data.created_at).toISOString(),
      sourceId: data.id,
      sourceParentId: projectId,
      url: data.web_url,
      title: '',
      body: data.notes[0].body,
      channel: `https://gitlab.com/project/${projectId}`,
      score: Gitlab_GRID[GitlabActivityType.DISCUSSION].score,
      isContribution: Gitlab_GRID[GitlabActivityType.DISCUSSION].isContribution,
    },
  ]
}

const parseStar = (
  data: ProjectStarrerSchema,
  projectId: string,
  user: IMemberData,
): IActivityData => {
  return {
    type: GitlabActivityType.STAR,
    member: user,
    timestamp: new Date(data.starred_since).toISOString(),
    sourceId: data.user.id.toString(),
    channel: `https://gitlab.com/project/${projectId}`,
    score: Gitlab_GRID[GitlabActivityType.STAR].score,
    isContribution: Gitlab_GRID[GitlabActivityType.STAR].isContribution,
  }
}

const parseFork = (data: ProjectSchema, projectId: string, user: IMemberData): IActivityData => {
  return {
    type: GitlabActivityType.FORK,
    member: user,
    timestamp: new Date(data.created_at).toISOString(),
    sourceId: data.id.toString(),
    sourceParentId: projectId,
    url: data.web_url,
    score: Gitlab_GRID[GitlabActivityType.FORK].score,
    isContribution: Gitlab_GRID[GitlabActivityType.FORK].isContribution,
  }
}

const parseMember = (memberData: any): IMemberData => {
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
  const apiData = ctx.data as GitlabApiData
  const { type, data, projectId, user } = apiData

  let activity: IActivityData

  switch (type) {
    case GitlabActivityType.ISSUE:
      activity = parseIssue(data as IssueSchema, projectId, user)
      break
    case GitlabActivityType.MERGE_REQUEST:
      activity = parseMergeRequest(data as MergeRequestSchema, projectId, user)
      break
    case GitlabActivityType.COMMIT:
      activity = parseCommit(data as CommitSchema, projectId, user)
      break
    case GitlabActivityType.DISCUSSION:
      activity = parseDiscussion(data, projectId)[0]
      break
    case GitlabActivityType.STAR:
      activity = parseStar(data as ProjectStarrerSchema, projectId, user)
      break
    case GitlabActivityType.FORK:
      activity = parseFork(data as ProjectSchema, projectId, user)
      break
    default:
      throw new Error(`Unsupported activity type: ${type}`)
  }

  await ctx.publishActivity(activity)
}

export default handler
