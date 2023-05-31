import axios from 'axios'
import { timeout } from '@crowd/common'
import { DevtoComment } from './types'

/**
 * Perform a lookup of article comments
 * @param articleId Devto article id for which to fetch the comments for
 * @returns {DevtoComment[]}
 */
export const getArticleComments = async (articleId: number): Promise<DevtoComment[]> => {
  try {
    const result = await axios.get('https://dev.to/api/comments', {
      params: {
        a_id: articleId,
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
          return getArticleComments(articleId)
        }
      }
    }

    throw err
  }
}
