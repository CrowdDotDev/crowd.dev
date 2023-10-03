import { timeout } from '@crowd/common'
import axios from 'axios'

export interface IDevToUser {
  id: number
  username: string
  name: string
  twitter_username: string | null
  github_username: string | null
  summary: string | null
  location: string | null
  website_url: string | null
  joined_at: string
  profile_image: string
}

export const getUser = async (userId: number): Promise<IDevToUser | null> => {
  try {
    const result = await axios.get(`https://dev.to/api/users/${userId}`, {
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
          return getUser(userId)
        }
      }
    } else if (err.response.status === 404) {
      return null
    }

    throw err
  }
}
