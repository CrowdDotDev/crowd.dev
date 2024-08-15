import { Gitlab, MergeRequestSchema } from '@gitbeaker/rest'
import { GitlabMergeRequestData, GitlabApiResult } from '../types'
import { getUser } from './getUser'
import { IProcessStreamContext } from '../../../types'

export const getMergeRequests = async ({
  api,
  projectId,
  page,
  ctx,
}: {
  api: InstanceType<typeof Gitlab>
  projectId: string
  page: number
  ctx: IProcessStreamContext
}): Promise<GitlabApiResult<GitlabMergeRequestData[]>> => {
  const since = ctx.onboarding
    ? undefined
    : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const perPage = 100

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
