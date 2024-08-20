import { Gitlab, MergeRequestNoteSchema } from '@gitbeaker/rest'
import { GitlabMergeRequestCommentData, GitlabApiResult } from '../types'
import { getUser } from './getUser'
import { IProcessStreamContext } from '../../../types'

export const getMergeRequestComments = async ({
  api,
  projectId,
  mergeRequestIId,
  page,
  ctx,
}: {
  api: InstanceType<typeof Gitlab>
  projectId: string
  mergeRequestIId: number
  page: number
  ctx: IProcessStreamContext
}): Promise<GitlabApiResult<GitlabMergeRequestCommentData[]>> => {
  const perPage = 100

  const response = await api.MergeRequestNotes.all(projectId, mergeRequestIId, {
    showExpanded: true,
    page,
    perPage,
  })

  const mergeRequestComments = response.data as MergeRequestNoteSchema[]

  const filteredComments = mergeRequestComments.filter((comment) => comment.system === false)

  const users = await Promise.all(
    filteredComments.map((comment) => getUser(api, comment.author.id)),
  )

  ctx.log.info({ filteredComments, users }, 'mergeRequestComments')

  return {
    data: filteredComments.map((comment, index) => ({
      data: comment,
      user: users[index],
    })),
    nextPage: response.paginationInfo.next,
  }
}
