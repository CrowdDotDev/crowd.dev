import axios from 'axios'
import { timeout } from '@crowd/common'
import { DevtoUser } from './types'

/**
 * Performs a lookup of a Dev.to user by user id
 * @param userId
 * @returns {DevtoUser} or null if no user found
 */
export const getUserById = async (userId: number): Promise<DevtoUser | null> => {
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
          return getUserById(userId)
        }
      }
    } else if (err.response.status === 404) {
      return null
    }

    throw err
  }
}

/**
 * Performs a lookup of a Dev.to user by username
 * @param username
 * @returns {DevtoUser} or null if no user found
 */
export const getUserByUsername = async (
  username: string,
  apiKey?: string,
): Promise<DevtoUser | null> => {
  try {
    const result = await axios.get('https://dev.to/api/users/by_username', {
      params: {
        url: username,
      },
      headers: {
        Accept: 'application/vnd.forem.api-v1+json',
        'api-key': apiKey || '',
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
          return getUserByUsername(username)
        }
      }
    } else if (err.response.status === 404) {
      return null
    }

    throw err
  }
}
