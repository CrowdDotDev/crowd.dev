import { Gitlab } from '@gitbeaker/rest'

export const getMergeRequests = async (
  api: InstanceType<typeof Gitlab>,
  projectId: string,
  page: number,
  onboarding: boolean,
) => {
  const perPage = 100
  const since = onboarding ? undefined : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const mergeRequests = await api.MergeRequests.all({
    projectId,
    page,
    perPage,
    updatedAfter: since,
  })

  return {
    data: mergeRequests,
    nextPage: mergeRequests.length === perPage ? page + 1 : null,
  }
}
