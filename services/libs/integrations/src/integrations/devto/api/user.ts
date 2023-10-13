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

export const getUser = async (userId: number, apiKey?: string): Promise<IDevToUser | null> => {
  try {
    const result = await axios.get(`https://dev.to/api/users/${userId}`, {
      headers: {
        Accept: 'application/vnd.forem.api-v1+json',
        'api-key': apiKey || '',
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
          return getUser(userId, apiKey)
        }
      }
    } else if (err.response.status === 404) {
      return null
    }

    throw err
  }
}
