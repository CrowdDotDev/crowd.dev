import { Gitlab, ProjectSchema } from '@gitbeaker/rest'
import { GitlabForkData } from '../types'
import { getUser } from './getUser'
import { GitlabApiResult } from '../types'

export const getForks = async (
  api: InstanceType<typeof Gitlab>,
  projectId: string,
  page: number,
  onboarding: boolean,
): Promise<GitlabApiResult<GitlabForkData[]>> => {
  const since = onboarding ? undefined : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const forks = (await api.Projects.allForks(projectId, {
    updatedAfter: since,
  })) as ProjectSchema[]

  const users = await Promise.all(forks.map((fork) => getUser(api, fork.owner.id)))

  return {
    data: forks.map((fork, index) => ({
      data: fork,
      user: users[index],
    })),
    nextPage: null,
  }
}
