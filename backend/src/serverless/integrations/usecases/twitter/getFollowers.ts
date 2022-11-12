import axios from 'axios'
import moment from 'moment'
import { TwitterGetFollowersInput, TwitterGetFollowersOutput } from '../../types/twitterTypes'
import { createServiceChildLogger } from '../../../../utils/logging'
import { cleanSuperfaceError } from '../cleanError'

const log = createServiceChildLogger('getFollowers')

/**
 * Get all followers of an account
 * @param input Input parameters
 * @returns Followers
 */
const getFollowers = async (
  input: TwitterGetFollowersInput,
): Promise<TwitterGetFollowersOutput> => {
  try {
    const config = {
      method: 'get',
      url: `https://api.twitter.com/2/users/${input.profileId}/followers?user.fields=name,description,location,public_metrics,url,verified,profile_image_url&pagination_token=D903MLRBG6U1EZZZ`,
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
    log.error({ err, input }, 'Error while getting messages from Twitter')
    throw cleanSuperfaceError(err)
  }
}

export default getFollowers
