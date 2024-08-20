import { Gitlab, IssueNoteSchema } from '@gitbeaker/rest'
import { GitlabIssueCommentData, GitlabApiResult } from '../types'
import { getUser } from './getUser'
import { IProcessStreamContext } from '../../../types'

export const getIssueComments = async ({
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
}): Promise<GitlabApiResult<GitlabIssueCommentData[]>> => {
  const perPage = 100

  // top level notes
  const response = await api.IssueNotes.all(projectId, issueIId, {
    showExpanded: true,
    page,
    perPage,
  })

  const notes = response.data as IssueNoteSchema[]

  const filteredNotes = notes.filter((note) => note.system === false)

  const users = await Promise.all(filteredNotes.map((note) => getUser(api, note.author.id)))

  ctx.log.info({ filteredNotes, users }, 'issue notes')

  return {
    data: filteredNotes.map((note, index) => ({
      data: note,
      user: users[index],
    })),
    nextPage: response.paginationInfo.next,
  }
}
