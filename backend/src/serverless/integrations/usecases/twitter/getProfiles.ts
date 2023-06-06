import axios, { AxiosRequestConfig } from 'axios'
import moment from 'moment'
import { Logger } from '@crowd/logging'
import {
  TwitterGetFollowersOutput,
  TwitterGetProfilesByUsernameInput,
} from '../../types/twitterTypes'
import { handleTwitterError } from './errorHandler'

/**
 * Get profiles by username
 * @param input Input parameters
 * @returns Profiles
 */
const getProfiles = async (
  input: TwitterGetProfilesByUsernameInput,
  logger: Logger,
): Promise<TwitterGetFollowersOutput> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: 'https://api.twitter.com/2/users/by',
    params: {
      usernames: input.usernames.join(','),
      'user.fields': 'name,description,location,public_metrics,url,verified,profile_image_url',
    },
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  }

  try {
    const response = await axios(config)
    const limit = parseInt(response.headers['x-rate-limit-remaining'], 10)
    const resetTs = parseInt(response.headers['x-rate-limit-reset'], 10) * 1000
    const timeUntilReset = moment(resetTs).diff(moment(), 'seconds')
    return {
      records: response.data.data,
      nextPage: response.data?.meta?.next_token || '',
      limit,
      timeUntilReset,
    }
  } catch (err) {
    const newErr = handleTwitterError(err, config, input, logger)
    throw newErr
  }
}

export default getProfiles
