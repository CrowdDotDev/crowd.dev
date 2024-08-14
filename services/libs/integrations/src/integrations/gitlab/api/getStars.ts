import { Gitlab, ProjectStarrerSchema } from '@gitbeaker/rest'
import { GitlabStarData, GitlabApiResult } from '../types'
import { getUser } from './getUser'

export const getStars = async (
  api: InstanceType<typeof Gitlab>,
  projectId: string,
  page: number,
  onboarding: boolean,
): Promise<GitlabApiResult<GitlabStarData[]>> => {
  const stars = (await api.Projects.allStarrers(projectId)) as ProjectStarrerSchema[]

  const users = await Promise.all(stars.map((star) => getUser(api, star.user.id)))

  return {
    data: stars.map((star, index) => ({
      data: star,
      user: users[index],
    })),
    nextPage: null,
  }
}
