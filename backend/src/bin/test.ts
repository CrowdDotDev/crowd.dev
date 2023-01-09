import { Repo } from '../serverless/integrations/types/regularTypes'
import IssueCommentsQuery from '../serverless/integrations/usecases/github/graphql/issueComments'
import IssuesQuery from '../serverless/integrations/usecases/github/graphql/issues'

const repo: Repo = {
  url: 'https://github.com/CrowdDotDev/crowd.dev',
  name: 'crowd.dev',
  owner: 'CrowdDotDev',
  createdAt: '2020-06-01T20:10:00Z',
}

const token = 'ghu_gGSB8RuNaS2l8zTZCBzomix7Ypw3eM3HxuRh'

setImmediate(async () => {
  const issuesQuery = new IssuesQuery(repo, token)

  const results = await issuesQuery.getSinglePage('')

  for (const issue of results.data) {
    const issueCommentsQuery = new IssueCommentsQuery(repo, issue.number, token)
    const comments = await issueCommentsQuery.getSinglePage('')
    console.log(issue.number, comments.data.length)
  }
})
