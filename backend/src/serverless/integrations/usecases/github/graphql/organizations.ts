import { graphql } from '@octokit/graphql'
import BaseQuery from './baseQuery'

/**
 * Get information from a organization using the GitHub GraphQL API.
 * @param name Name of the organization in GitHub
 * @param token GitHub personal access token
 * @returns Information from organization
 */
const getOrganization = async (name: string, token: string): Promise<any> => {
  let organization: string | null
  try {
    const graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${token}`,
      },
    })

    organization = (
      (await graphqlWithAuth(`{ 
            organization(login: "${name}") ${BaseQuery.ORGANIZATION_SELECT}
          }
      `)) as any
    ).organization
  } catch (err) {
    // It may be that the organization was not found, if for example it is a bot
    // In that case we want to return null instead of throwing an error
    if (err.errors && err.errors[0].type === 'NOT_FOUND') {
      organization = null
    } else {
      throw err
    }
  }
  return organization
}

export default getOrganization
