import axios from 'axios'
import { timeout } from '@crowd/common'
import { DevtoArticle } from './types'

/**
 * Performs a lookup of users articles
 * @param username Dev.to user to fetch articles from
 * @param page For API pagination
 * @returns {DevtoArticle[]}
 */
export const getUserArticles = async (
  username: string,
  page: number,
  perPage: number,
): Promise<DevtoArticle[]> => {
  try {
    const result = await axios.get(`https://dev.to/api/articles`, {
      params: {
        username,
        page,
        per_page: perPage,
      },
    })
    return result.data
  } catch (err: any) {
    // rate limit?
    if (err.response.status === 429) {
      const retryAfter = err.response.headers['retry-after']
      if (retryAfter) {
        const retryAfterSeconds = parseInt(retryAfter, 10)
        if (retryAfterSeconds <= 2) {
          await timeout(1000 * retryAfterSeconds)
          return getUserArticles(username, page, perPage)
        }
      }
    }

    throw err
  }
}

export const getAllUserArticles = async (username: string): Promise<DevtoArticle[]> => {
  let page = 1
  const perPage = 50

  let allArticles: DevtoArticle[] = []

  let result = await getUserArticles(username, page, perPage)
  while (result.length > 0) {
    allArticles = allArticles.concat(...result)
    result = await getUserArticles(username, ++page, perPage)
  }

  return allArticles
}
