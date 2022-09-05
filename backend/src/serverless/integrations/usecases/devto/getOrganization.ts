import axios from 'axios'
import { DevtoOrganization } from './types'
import { timeout } from '../../../../utils/timing'

/**
 * Performs a lookup of a Dev.to organization
 * @param organization
 * @returns {DevtoOrganization} or null if no organization found
 */
export const getOrganization = async (organization: string): Promise<DevtoOrganization> => {
  try {
    const result = await axios.get(`https://dev.to/api/organizations/${organization}`)
    return result.data
  } catch (err: any) {
    // rate limit?
    if (err.response.status === 429) {
      const retryAfter = err.response.headers['retry-after']
      if (retryAfter) {
        const retryAfterSeconds = parseInt(retryAfter, 10)
        if (retryAfterSeconds <= 2) {
          await timeout(1000 * retryAfterSeconds)
          return getOrganization(organization)
        }
      }
    } else if (err.response.status === 404) {
      return null
    }

    throw err
  }
}
