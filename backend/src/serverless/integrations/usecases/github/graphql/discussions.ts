import { Repo } from '../../../types/regularTypes'

import BaseQuery from './baseQuery'

/* eslint class-methods-use-this: 0 */
class DiscussionsQuery extends BaseQuery {
  repo: Repo

  constructor(repo: Repo, githubToken: string, perPage: number = 100) {
    const discussionsQuery = `{
        repository(owner: "${repo.owner}", name: "${repo.name}") {
          discussions(last: ${perPage}, \${beforeCursor}) {
            pageInfo ${BaseQuery.PAGE_SELECT}
            nodes {
              author {
                ... on User ${BaseQuery.USER_SELECT}
              }
              number
              bodyText
              title
              id
              url
              createdAt
              comments {
                totalCount
              }
              category {
                id
                isAnswerable
                name
                slug
                emoji
                description
              }
            }
          }
        }
      }`

    super(githubToken, discussionsQuery, 'discussions', perPage)

    this.repo = repo
  }

  getEventData(result) {
    return { ...super.getEventData(result), data: result.repository?.discussions?.nodes }
  }
}

export default DiscussionsQuery
