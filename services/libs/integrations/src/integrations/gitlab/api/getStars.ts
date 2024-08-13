import { Gitlab } from '@gitbeaker/rest'

export const getStars = async (
  api: InstanceType<typeof Gitlab>,
  projectId: string,
  page: number,
  onboarding: boolean,
) => {
  const stars = await api.Projects.allStarrers(projectId)

  return {
    data: stars,
    nextPage: null,
  }
}
