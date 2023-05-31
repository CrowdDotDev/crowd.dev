import axios from 'axios'
import { timeout } from '@crowd/common'
import { DevtoArticle } from './types'

/**
 * Performs a lookup of organization articles
 * @param organizationName Organization name to fetch articles from
 * @param page For API pagination
 * @param perPage For API pagination
 * @returns {DevtoArticle[]}
 */
export const getOrganizationArticles = async (
  organizationName: string,
  page: number,
  perPage: number,
): Promise<DevtoArticle[]> => {
  try {
    const result = await axios.get(
      `https://dev.to/api/organizations/${encodeURIComponent(organizationName)}/articles`,
      {
        params: {
          page,
          per_page: perPage,
        },
      },
    )
    return result.data
  } catch (err: any) {
    // rate limit?
    if (err.response.status === 429) {
      const retryAfter = err.response.headers['retry-after']
      if (retryAfter) {
        const retryAfterSeconds = parseInt(retryAfter, 10)
        if (retryAfterSeconds <= 2) {
          await timeout(1000 * retryAfterSeconds)
          return getOrganizationArticles(organizationName, page, perPage)
        }
      }
    }

    throw err
  }
}

export const getAllOrganizationArticles = async (
  organizationName: string,
): Promise<DevtoArticle[]> => {
  let page = 1
  const perPage = 50

  let allArticles: DevtoArticle[] = []

  let result = await getOrganizationArticles(organizationName, page, perPage)
  while (result.length > 0) {
    allArticles = allArticles.concat(...result)
    result = await getOrganizationArticles(organizationName, ++page, perPage)
  }

  return allArticles
}
