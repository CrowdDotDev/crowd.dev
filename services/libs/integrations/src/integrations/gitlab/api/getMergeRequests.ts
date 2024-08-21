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

  const response = await api.MergeRequests.all({
    projectId,
    page,
    perPage,
    updatedAfter: since,
    showExpanded: true,
  })

  const mergeRequests = response.data as MergeRequestSchema[]

  const users = []
  for (const mr of mergeRequests) {
    const user = await getUser(api, mr.author.id, ctx)
    users.push(user)
  }

  return {
    data: mergeRequests.map((mr, index) => ({
      data: mr,
      user: users[index],
    })),
    nextPage: response.paginationInfo.next,
  }
}
