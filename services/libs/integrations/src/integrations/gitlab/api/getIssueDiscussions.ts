import { Gitlab, DiscussionSchema, DiscussionNoteSchema } from '@gitbeaker/rest'
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

  const notes = discussions.flatMap((discussion) => discussion.notes) as DiscussionNoteSchema[]

  const filteredNotes = notes.filter((note) => note.system === false)

  const users = []
  for (const note of filteredNotes) {
    if (note?.author?.id) {
      const user = await getUser(api, note.author.id, ctx)
      users.push(user)
    }
  }

  ctx.log.info({ filteredNotes, users }, 'issue discussions')

  return {
    data: filteredNotes?.map((note, index) => ({
      data: note,
      user: users[index],
    })),
    nextPage: response.paginationInfo.next,
  }
}
