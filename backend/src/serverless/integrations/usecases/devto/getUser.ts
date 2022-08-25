import axios from 'axios'
import { timeout } from '../../../../utils/timing'
import { DevtoUser } from './types'

/**
 * Performs a lookup of a Dev.to user
 * @param userId
 * @returns {DevtoUser}
 */
export const getUser = async (userId: number): Promise<DevtoUser> => {
  try {
    const result = await axios.get(`https://dev.to/api/users/${userId}`)
    return result.data
  } catch (err: any) {
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
    }

    throw err
  }
}
