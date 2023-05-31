import axios, { AxiosRequestConfig } from 'axios'
import moment from 'moment'
import { Logger } from '@crowd/logging'
import { TwitterGetFollowersInput, TwitterGetFollowersOutput } from '../../types/twitterTypes'
import { handleTwitterError } from './errorHandler'

/**
 * Get all followers of an account
 * @param input Input parameters
 * @returns Followers
 */
const getFollowers = async (
  input: TwitterGetFollowersInput,
  logger: Logger,
): Promise<TwitterGetFollowersOutput> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://api.twitter.com/2/users/${input.profileId}/followers`,
    params: {
      'user.fields': 'name,description,location,public_metrics,url,verified,profile_image_url',
    },
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  }

  if (input.perPage) {
    config.params.max_results = input.perPage
  }

  if (input.page) {
    config.params.pagination_token = input.page
  }

  try {
    const response = await axios(config)

    let limit: number
    let timeUntilReset: number
    if (response.headers['x-rate-limit-remaining'] && response.headers['x-rate-limit-reset']) {
      limit = parseInt(response.headers['x-rate-limit-remaining'], 10)
      const resetTs = parseInt(response.headers['x-rate-limit-reset'], 10) * 1000
      timeUntilReset = moment(resetTs).diff(moment(), 'seconds')
    } else {
      limit = 0
      timeUntilReset = 0
    }

    if (
      response.data.meta &&
      response.data.meta.result_count &&
      response.data.meta.result_count > 0
    ) {
      return {
        records: response.data.data,
        nextPage: response.data?.meta?.next_token || '',
        limit,
        timeUntilReset,
      }
    }
    return {
      records: [],
      nextPage: '',
      limit,
      timeUntilReset,
    }
  } catch (err) {
    const newErr = handleTwitterError(err, config, input, logger)
    throw newErr
  }
}

export default getFollowers
