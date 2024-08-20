import { Gitlab, DiscussionSchema } from '@gitbeaker/rest'
import { GitlabDisccusionCommentData, GitlabApiResult } from '../types'
import { getUser } from './getUser'
import { IProcessStreamContext } from '../../../types'

export const getIssueDiscussions = async ({
  api,
  projectId,
  issueIId,
  page,
  ctx,
}: {
  api: InstanceType<typeof Gitlab>
  projectId: string
  issueIId: number
  page: number
  ctx: IProcessStreamContext
}): Promise<GitlabApiResult<GitlabDisccusionCommentData[]>> => {
  const perPage = 100

  // discussions
  const response = await api.IssueDiscussions.all(projectId, issueIId, {
    showExpanded: true,
    page,
    perPage,
  })

  const discussions = response.data as DiscussionSchema[]

  const notes = discussions.flatMap((discussion) => discussion.notes)

  const users = await Promise.all(notes.map((note) => getUser(api, note.author.id)))

  ctx.log.info({ notes, users }, 'issue discussions')

  return {
    data: notes.map((note, index) => ({
      data: note,
      user: users[index],
    })),
    nextPage: response.paginationInfo.next,
  }
}
