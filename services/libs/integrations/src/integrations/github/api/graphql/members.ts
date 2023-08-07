/* eslint-disable  @typescript-eslint/no-explicit-any */
import { graphql } from '@octokit/graphql'
import BaseQuery from './baseQuery'

/**
 * Get information from a member using the GitHub GraphQL API.
 * @param username GitHub username
 * @param token GitHub personal access token
 * @returns Information from member
 */
const getMember = async (username: string, token: string): Promise<any> => {
  let user: string | null
  try {
    const graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${token}`,
      },
    })

    user = (
      (await graphqlWithAuth(`{ 
            user(login: "${username}") ${BaseQuery.USER_SELECT}
          }
      `)) as any
    ).user
  } catch (err) {
    // It may be that the user was not found, if for example it is a bot
    // In that case we want to return null instead of throwing an error
    if (err.errors && err.errors[0].type === 'NOT_FOUND') {
      user = null
    } else {
      throw BaseQuery.processGraphQLError(err)
    }
  }
  return user
}

export default getMember
