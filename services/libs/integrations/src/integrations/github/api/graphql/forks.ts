import { Repo } from '../../types'
import BaseQuery from './baseQuery'

/* eslint class-methods-use-this: 0 */
class ForksQuery extends BaseQuery {
  repo: Repo

  constructor(repo: Repo, githubToken: string, perPage = 100) {
    const forksQuery = `{
        repository(owner: "${repo.owner}", name: "${repo.name}") {
          forks(last: ${perPage}, \${beforeCursor}) {
            pageInfo ${BaseQuery.PAGE_SELECT}
            nodes {
              owner {
                ... on User ${BaseQuery.USER_SELECT}
              }
              name
              url
              id
              createdAt
            }
          }
        }
      }`

    super(githubToken, forksQuery, 'forks', perPage)

    this.repo = repo
  }

  getEventData(result) {
    return { ...super.getEventData(result), data: result.repository?.forks?.nodes }
  }
}

export default ForksQuery
