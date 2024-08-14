import { Gitlab, MergeRequestSchema } from '@gitbeaker/rest'
import { GitlabMergeRequestData, GitlabApiResult } from '../types'
import { getUser } from './getUser'

export const getMergeRequests = async (
  api: InstanceType<typeof Gitlab>,
  projectId: string,
  page: number,
  onboarding: boolean,
): Promise<GitlabApiResult<GitlabMergeRequestData[]>> => {
  const perPage = 100
  const since = onboarding ? undefined : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const mergeRequests = (await api.MergeRequests.all({
    projectId,
    page,
    perPage,
    updatedAfter: since,
  })) as MergeRequestSchema[]

  const users = await Promise.all(mergeRequests.map((mr) => getUser(api, mr.author.id)))

  return {
    data: mergeRequests.map((mr, index) => ({
      data: mr,
      user: users[index],
    })),
    nextPage: mergeRequests.length === perPage ? page + 1 : null,
  }
}
