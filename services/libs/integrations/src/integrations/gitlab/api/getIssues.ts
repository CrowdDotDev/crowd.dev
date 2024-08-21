import { Gitlab, IssueSchema } from '@gitbeaker/rest'
import { GitlabIssueData, GitlabApiResult } from '../types'
import { getUser } from './getUser'
import { IProcessStreamContext } from '../../../types'

export const getIssues = async ({
  api,
  projectId,
  page,
  ctx,
}: {
  api: InstanceType<typeof Gitlab>
  projectId: string
  page: number
  ctx: IProcessStreamContext
}): Promise<GitlabApiResult<GitlabIssueData[]>> => {
  const perPage = 100
  const since = ctx.onboarding
    ? undefined
    : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const response = await api.Issues.all({
    projectId,
    page,
    perPage,
    updatedAfter: since,
    showExpanded: true,
  })

  const issues = response.data as IssueSchema[]

  const users = []
  for (const issue of issues) {
    const user = await getUser(api, issue.author.id, ctx)
    users.push(user)
  }

  ctx.log.info({ issues, users }, 'issues')

  return {
    data: issues.map((issue, index) => ({
      data: issue,
      user: users[index],
    })),
    nextPage: response.paginationInfo.next,
  }
}
