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

  const users = await Promise.all(
    mergeRequestComments.map((comment) => getUser(api, comment.author.id)),
  )

  ctx.log.info({ mergeRequestComments, users }, 'mergeRequestComments')

  return {
    data: mergeRequestComments.map((comment, index) => ({
      data: comment,
      user: users[index],
    })),
    nextPage: response.paginationInfo.next,
  }
}
