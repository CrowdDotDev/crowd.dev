import moment from 'moment'
import axios from 'axios'
import {
  TwitterGetFollowersOutput,
  TwitterGetProfilesByUsernameInput,
} from '../../types/twitterTypes'
import { Logger } from '../../../../utils/logging'

/**
 * Get profiles by username
 * @param input Input parameters
 * @returns Profiles
 */
const getProfiles = async (
  input: TwitterGetProfilesByUsernameInput,
  logger: Logger,
): Promise<TwitterGetFollowersOutput> => {
  try {
    const config = {
      method: 'get',
      url: `https://api.twitter.com/2/users/by?usernames=${input.usernames}&user.fields=name,description,location,public_metrics,url,verified,profile_image_url`,
      headers: {
        Authorization: `Bearer ${input.token}`,
      },
    }
    const response = await axios(config)
    const limit = parseInt(response.headers['x-rate-limit-remaining'], 10)
    const resetTs = parseInt(response.headers['x-rate-limit-reset'], 10) * 1000
    const timeUntilReset = moment(resetTs).diff(moment(), 'seconds')
    return {
      records: response.data.data,
      nextPage: response.data.meta.next_token || '',
      limit,
      timeUntilReset,
    }
  } catch (err) {
    logger.error({ err, input }, 'Error while getting profiles from Twitter')
    throw err
  }
}

export default getProfiles
