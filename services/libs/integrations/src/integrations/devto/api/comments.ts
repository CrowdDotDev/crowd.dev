import axios from 'axios'
import { IDevToUser } from './user'
import { timeout } from '@crowd/common'

export interface IDevtoCommentUser {
  user_id: number
  name: string
  username: string
  twitter_username: string | null
  github_username: string | null
  website_url: string | null
  profile_image: string
  profile_image_90: string
}

export interface IDevToComment {
  id_code: string
  created_at: string
  body_html: string
  user: IDevtoCommentUser
  fullUser?: IDevToUser
  children: IDevToComment[]
}

export const getArticleComments = async (articleId: number): Promise<IDevToComment[]> => {
  try {
    const result = await axios.get('https://dev.to/api/comments', {
      params: {
        a_id: articleId,
      },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
      },
    })
    return result.data
  } catch (err) {
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
