import { Repo } from '../../../types/regularTypes'
import BaseQuery from './baseQuery'

/* eslint class-methods-use-this: 0 */
class PullRequestsQuery extends BaseQuery {
  repo: Repo

  constructor(repo: Repo, githubToken: string, perPage: number = 100) {
    const pullRequestsQuery = `{
            repository(owner: "${repo.owner}", name: "${repo.name}") {
              pullRequests(last: ${perPage}, \${beforeCursor}) {
                pageInfo ${BaseQuery.PAGE_SELECT}
                nodes {
                    author {
                        ... on User ${BaseQuery.USER_SELECT}
                    }
                    bodyText
                    state
                    title
                    id
                    url
                    createdAt
                    number
                }
                
              }
            }
          }`

    super(githubToken, pullRequestsQuery, 'pullRequests', perPage)

    this.repo = repo
  }

  getEventData(result) {
    return { ...super.getEventData(result), data: result.repository?.pullRequests?.nodes }
  }
}

export default PullRequestsQuery
