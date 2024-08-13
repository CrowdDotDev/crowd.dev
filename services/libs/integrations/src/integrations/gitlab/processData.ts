import { ProcessDataHandler } from '../../types'
import { GitlabActivityType, GitlabApiData } from './types'
import { IActivityData, IMemberData, PlatformType, MemberIdentityType } from '@crowd/types'
import { Gitlab_GRID } from './grid'
import { ProjectSchema, ProjectStarrerSchema, Camelize } from '@gitbeaker/rest'

const parseIssue = (data: any, projectId: string): IActivityData[] => {
  return [
    {
      type: GitlabActivityType.ISSUE,
      member,
      timestamp: new Date(data.created_at).toISOString(),
      sourceId: data.id.toString(),
      sourceParentId: projectId,
      url: data.web_url,
      title: data.title,
      body: data.description,
      channel: `https://gitlab.com/project/${projectId}`,
      score: Gitlab_GRID[GitlabActivityType.ISSUE].score,
      isContribution: Gitlab_GRID[GitlabActivityType.ISSUE].isContribution,
    },
  ]
}

const parseMergeRequest = (data: any, projectId: string): IActivityData[] => {
  return [
    {
      type: GitlabActivityType.MERGE_REQUEST,
      member,
      timestamp: new Date(data.created_at).toISOString(),
      sourceId: data.id.toString(),
      sourceParentId: projectId,
      url: data.web_url,
      title: data.title,
      body: data.description,
      channel: `https://gitlab.com/project/${projectId}`,
      score: Gitlab_GRID[GitlabActivityType.MERGE_REQUEST].score,
      isContribution: Gitlab_GRID[GitlabActivityType.MERGE_REQUEST].isContribution,
    },
  ]
}

const parseCommit = (data: any, projectId: string): IActivityData[] => {
  return [
    {
      type: GitlabActivityType.COMMIT,
      member,
      timestamp: new Date(data.created_at).toISOString(),
      sourceId: data.id,
      sourceParentId: projectId,
      url: data.web_url,
      title: data.title,
      body: data.message,
      channel: `https://gitlab.com/project/${projectId}`,
      score: Gitlab_GRID[GitlabActivityType.COMMIT].score,
      isContribution: Gitlab_GRID[GitlabActivityType.COMMIT].isContribution,
    },
  ]
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
  data: ProjectStarrerSchema[],

  projectId: string,
): IActivityData[] => {
  return data.map((starrer) => ({
    type: GitlabActivityType.STAR,
    member,
    timestamp: new Date(starrer.starred_since).toISOString(),
    sourceId: starrer.user.id.toString(),
    channel: `https://gitlab.com/project/${projectId}`,
    score: Gitlab_GRID[GitlabActivityType.STAR].score,
    isContribution: Gitlab_GRID[GitlabActivityType.STAR].isContribution,
  }))
}

const parseFork = (data: ProjectSchema[], projectId: string): IActivityData[] => {
  return data.map((fork) => ({
    type: GitlabActivityType.FORK,
    member: parseMember(fork.owner),
    timestamp: new Date(fork.created_at).toISOString(),
    sourceId: fork.id.toString(),
    sourceParentId: projectId,
    url: fork.web_url,
    score: Gitlab_GRID[GitlabActivityType.FORK].score,
    isContribution: Gitlab_GRID[GitlabActivityType.FORK].isContribution,
  }))
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
  const { type, data, projectId } = apiData

  let activities: IActivityData[]

  switch (type) {
    case GitlabActivityType.ISSUE:
      activities = parseIssue(data, projectId)
      break
    case GitlabActivityType.MERGE_REQUEST:
      activities = parseMergeRequest(data, projectId)
      break
    case GitlabActivityType.COMMIT:
      activities = parseCommit(data, projectId)
      break
    case GitlabActivityType.DISCUSSION:
      activities = parseDiscussion(data, projectId)
      break
    case GitlabActivityType.STAR:
      activities = parseStar(data, projectId)
      break
    case GitlabActivityType.FORK:
      activities = parseFork(data, projectId)
      break
    default:
      throw new Error(`Unsupported activity type: ${type}`)
  }

  for (const activity of activities) {
    await ctx.publishActivity(activity)
  }
}

export default handler
