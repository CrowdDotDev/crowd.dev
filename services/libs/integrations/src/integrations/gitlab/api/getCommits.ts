import { Gitlab } from '@gitbeaker/rest'

export const getCommits = async (
  api: InstanceType<typeof Gitlab>,
  projectId: string,
  page: number,
  onboarding: boolean,
) => {
  const perPage = 100
  const since = onboarding ? undefined : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const commits = await api.Commits.all(projectId, {
    page,
    perPage,
    since,
  })

  return {
    data: commits,
    nextPage: commits.length === perPage ? page + 1 : null,
  }
}
