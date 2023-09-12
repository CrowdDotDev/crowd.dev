/* eslint-disable  @typescript-eslint/no-explicit-any */
import { graphql } from '@octokit/graphql'
import { GraphQlQueryResponseData } from '@octokit/graphql/dist-types/types'
import { GraphQlQueryResponse } from '@crowd/types'
import { RateLimitError } from '@crowd/types'

class BaseQuery {
  static BASE_URL = 'https://api.github.com/graphql'

  static USER_SELECT = `{
        login
        name
        avatarUrl
        id
        isHireable
        twitterUsername
        url
        websiteUrl
        email
        bio
        company
        location
        followers {
          totalCount
        }
    }`

  static ORGANIZATION_SELECT = `{
    email
    url
    location
    name
    twitterUsername
    websiteUrl
    description
    avatarUrl
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

    try {
      const result = await this.graphQL(paginatedQuery)
      return this.getEventData(result)
    } catch (err) {
      throw BaseQuery.processGraphQLError(err)
    }
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

  static processGraphQLError(err: any): any {
    if (
      (err.status &&
        err.status === 403 &&
        err.message &&
        (err.message as string).includes('secondary rate limit')) ||
      (err.errors && err.errors[0].type === 'RATE_LIMITED')
    ) {
      if (err.headers && err.headers['x-ratelimit-reset']) {
        const query =
          err.request && err.request.query ? err.request.query : 'Unknown GraphQL query!'

        const epochReset = parseInt(err.headers['x-ratelimit-reset'], 10)
        const resetDate = new Date(epochReset * 1000) // JavaScript Date constructor takes milliseconds
        const diffInSeconds = Math.floor((resetDate.getTime() - Date.now()) / 1000)

        return new RateLimitError(diffInSeconds + 5, query, err)
      }
    }

    return err
  }
}

export default BaseQuery
