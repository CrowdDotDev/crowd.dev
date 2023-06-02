import axios, { AxiosRequestConfig } from 'axios'
import moment from 'moment'
import { Logger } from '@crowd/logging'
import {
  TwitterGetPostsByHashtagInput,
  TwitterGetPostsOutput,
  TwitterParsedPosts,
} from '../../types/twitterTypes'
import { handleTwitterError } from './errorHandler'

/**
 * Get paginated posts by hashtag
 * @param input Input parameters
 * @returns Posts
 */
const getPostsByHashtag = async (
  input: TwitterGetPostsByHashtagInput,
  logger: Logger,
): Promise<TwitterGetPostsOutput> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: 'https://api.twitter.com/2/tweets/search/recent',
    params: {
      max_results: input.perPage,
      'tweet.fields': 'id,text,created_at,entities,referenced_tweets,attachments',
      expansions: 'attachments.media_keys,author_id',
      'media.fields': 'duration_ms,height,media_key,preview_image_url,type,url,width,alt_text',
      'user.fields': 'name,description,location,public_metrics,url,verified,profile_image_url',
      query: `#${input.hashtag}`,
    },
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  }

  if (input.page !== undefined && input.page !== '') {
    config.params.next_token = input.page
  }

  try {
    const response = await axios(config)
    const limit = parseInt(response.headers['x-rate-limit-remaining'], 10)
    const resetTs = parseInt(response.headers['x-rate-limit-reset'], 10) * 1000
    const timeUntilReset = moment(resetTs).diff(moment(), 'seconds')

    if (response.data?.meta?.result_count === 0) {
      return {
        records: [],
        limit,
        timeUntilReset,
        nextPage: '',
      }
    }

    const posts = response.data.data
    const media = response.data.includes.media
    const users = response.data.includes.users

    const postsOut: TwitterParsedPosts = []

    for (const post of posts) {
      if (post.attachments?.media_keys) {
        const computedMedia = post.attachments.media_keys.map((key) =>
          media.find((m) => m.media_key === key),
        )
        post.attachments = computedMedia
      }
      const member = users.find((u) => u.id === post.author_id)
      post.member = member
      postsOut.push(post)
    }

    return {
      records: postsOut,
      nextPage: response.data?.meta?.next_token || '',
      limit,
      timeUntilReset,
    }
  } catch (err) {
    const newErr = handleTwitterError(err, config, input, logger)
    throw newErr
  }
}

export default getPostsByHashtag
