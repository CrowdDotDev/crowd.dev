import { graphql } from '@octokit/graphql'
import { GraphQlQueryResponseData } from '@octokit/graphql/dist-types/types'
import { GraphQlQueryResponse } from '../../../types/messageTypes'

class BaseQuery {
  static BASE_URL = 'https://api.github.com/graphql'

  static USER_SELECT = `{
        login
        name
        id
        isHireable
        twitterUsername
        url
        websiteUrl
        email
        bio
        company
        location
    }`

  static ORGANIZATION_SELECT = `{
    description
    websiteUrl
  }`

  static PAGE_SELECT = `{
        hasPreviousPage
        startCursor
    }`

  graphQL

  query

  githubToken

  additionalHeaders

  perPage

  eventType

  constructor(githubToken: string, query: string, eventType: string, perPage: number) {
    this.githubToken = githubToken
    this.query = query
    this.perPage = perPage
    this.eventType = eventType
    this.graphQL = graphql.defaults({
      headers: {
        authorization: `token ${this.githubToken}`,
      },
    })
  }

  /**
   * Substitutes a variable like string $var with given variable
   * in a string. Useful when reusing the same string template
   * for multiple graphql paging requests.
   * $var in the string is substituted with obj[var]
   * @param str string to make the substitution
   * @param obj object containing variable to interpolate
   * @returns interpolated string
   */
  static interpolate(str: string, obj: any): string {
    return str.replace(/\${([^}]+)}/g, (_, prop) => obj[prop])
  }

  /**
   * Gets a single page result given a cursor.
   * Single page before the given cursor will be fetched.
   * @param beforeCursor Cursor to paginate records before it
   * @returns parsed graphQl result
   */
  async getSinglePage(beforeCursor: string): Promise<GraphQlQueryResponse> {
    const paginatedQuery = BaseQuery.interpolate(this.query, {
      beforeCursor: BaseQuery.getPagination(beforeCursor),
    })

    const result = await this.graphQL(paginatedQuery)
    return this.getEventData(result)
  }

  /**
   * Parses graphql result into an object.
   * Object contains information about paging, and fetched data.
   * @param result from graphql query
   * @returns parsed result into paging and data values.
   */
  getEventData(result: GraphQlQueryResponseData): GraphQlQueryResponse {
    return {
      hasPreviousPage: result.repository[this.eventType].pageInfo?.hasPreviousPage,
      startCursor: result.repository[this.eventType].pageInfo?.startCursor,
      data: [{}],
    }
  }

  /**
   * Returns pagination string given cursor.
   * @param beforeCursor cursor to use for the pagination
   * @returns pagination string that can be injected into a graphql query.
   */
  static getPagination(beforeCursor: string): string {
    if (beforeCursor) {
      return `before: "${beforeCursor}"`
    }
    return ''
  }
}

export default BaseQuery
