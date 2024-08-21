import { Gitlab, ProjectSchema } from '@gitbeaker/rest'
import { GitlabForkData } from '../types'
import { getUser } from './getUser'
import { GitlabApiResult } from '../types'
import { IProcessStreamContext } from '../../../types'

export const getForks = async ({
  api,
  projectId,
  ctx,
}: {
  api: InstanceType<typeof Gitlab>
  projectId: string
  ctx: IProcessStreamContext
}): Promise<GitlabApiResult<GitlabForkData[]>> => {
  const since = ctx.onboarding
    ? undefined
    : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const forks = (await api.Projects.allForks(projectId, {
    updatedAfter: since,
  })) as ProjectSchema[]

  const users = []
  for (const fork of forks) {
    const user = await getUser(api, fork.owner.id, ctx)
    users.push(user)
  }

  ctx.log.info({ forks, users }, 'forks')

  return {
    data: forks.map((fork, index) => ({
      data: fork,
      user: users[index],
    })),
    nextPage: null,
  }
}
