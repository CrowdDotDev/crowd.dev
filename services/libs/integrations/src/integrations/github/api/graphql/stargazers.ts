import { Repo } from '../../types'
import BaseQuery from './baseQuery'

/* eslint class-methods-use-this: 0 */
class StargazersQuery extends BaseQuery {
  repo: Repo

  constructor(repo: Repo, githubToken: string, perPage = 100) {
    const stargazersQuery = `{
            repository(owner: "${repo.owner}", name: "${repo.name}") {
              stargazers(last: ${perPage}, \${beforeCursor}) {
                pageInfo ${BaseQuery.PAGE_SELECT}
                totalCount
                edges {
                  starredAt
                  node {
                    ___typename
                    ... on Actor {
                      ... on User ${BaseQuery.USER_SELECT}
                      ... on Bot ${BaseQuery.BOT_SELECT}
                    }
                  }
                }
              }
            }
          }`

    super(githubToken, stargazersQuery, 'stargazers', perPage)

    this.repo = repo
  }

  getEventData(result) {
    return { ...super.getEventData(result), data: result.repository?.stargazers?.edges }
  }
}

export default StargazersQuery
