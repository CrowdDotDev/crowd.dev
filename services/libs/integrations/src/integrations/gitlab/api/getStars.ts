import { Gitlab, ProjectStarrerSchema } from '@gitbeaker/rest'
import { GitlabStarData, GitlabApiResult } from '../types'
import { getUser } from './getUser'
import { IProcessStreamContext } from '../../../types'

export const getStars = async ({
  api,
  projectId,
  page,
  ctx,
}: {
  api: InstanceType<typeof Gitlab>
  projectId: string
  page: number
  ctx: IProcessStreamContext
}): Promise<GitlabApiResult<GitlabStarData[]>> => {
  const stars = (await api.Projects.allStarrers(projectId)) as ProjectStarrerSchema[]

  const users = await Promise.all(stars.map((star) => getUser(api, star.user.id)))

  ctx.log.info({ stars, users }, 'stars')

  return {
    data: stars.map((star, index) => ({
      data: star,
      user: users[index],
    })),
    nextPage: null,
  }
}
