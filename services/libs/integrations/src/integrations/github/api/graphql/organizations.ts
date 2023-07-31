/* eslint-disable  @typescript-eslint/no-explicit-any */
import { getServiceChildLogger } from '@crowd/logging'
import { graphql } from '@octokit/graphql'
import BaseQuery from './baseQuery'

const logger = getServiceChildLogger('github.getOrganization')

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

    const sanitizedName = name.replaceAll('\\', '').replaceAll('"', '')

    const organizationsQuery = `{
      search(query: "type:org ${sanitizedName}", type: USER, first: 10) {
        nodes {
          ... on Organization ${BaseQuery.ORGANIZATION_SELECT}
          }
        }
        rateLimit {
            limit
            cost
            remaining
            resetAt
        }
      }`

    organization = (await graphqlWithAuth(organizationsQuery)) as any

    organization =
      (organization as any).search.nodes.length > 0 ? (organization as any).search.nodes[0] : null
  } catch (err) {
    logger.error(err, { name }, 'Error getting organization!')
    // It may be that the organization was not found, if for example it is a bot
    // In that case we want to return null instead of throwing an error
    if (err.errors && err.errors[0].type === 'NOT_FOUND') {
      organization = null
    } else {
      throw BaseQuery.processGraphQLError(err)
    }
  }
  return organization
}

export default getOrganization
