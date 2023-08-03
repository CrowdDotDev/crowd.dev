import BaseQuery from './baseQuery'

/* eslint class-methods-use-this: 0 */
class TeamsQuery extends BaseQuery {
  constructor(teamNodeId: string, githubToken: string, perPage = 50) {
    const teamsQuery = `{
                node(id: "${teamNodeId}") {
                    ... on Team {
                            members {
                                nodes ${BaseQuery.USER_SELECT}
                            }
                        }
                    }
                }`

    super(githubToken, teamsQuery, 'teams', perPage)
  }

  getEventData(result) {
    return { hasPreviousPage: false, startCursor: '', data: result.node?.members?.nodes }
  }
}

export default TeamsQuery
