import { Gitlab, IssueNoteSchema } from '@gitbeaker/rest'
import { GitlabIssueCommentData, GitlabApiResult } from '../types'
import { getUser } from './getUser'
import { IProcessStreamContext } from '../../../types'

export const getIssueComments = async ({
  api,
  projectId,
  issueId,
  page,
  ctx,
}: {
  api: InstanceType<typeof Gitlab>
  projectId: string
  issueId: number
  page: number
  ctx: IProcessStreamContext
}): Promise<GitlabApiResult<GitlabIssueCommentData[]>> => {
  const perPage = 100

  const response = await api.IssueNotes.all(projectId, issueId, {
    showExpanded: true,
    page,
    perPage,
  })

  const issues = response.data as IssueNoteSchema[]

  const users = await Promise.all(issues.map((issue) => getUser(api, issue.author.id)))

  ctx.log.info({ issues, users }, 'issues')

  return {
    data: issues.map((issue, index) => ({
      data: issue,
      user: users[index],
    })),
    nextPage: response.paginationInfo.next,
  }
}
