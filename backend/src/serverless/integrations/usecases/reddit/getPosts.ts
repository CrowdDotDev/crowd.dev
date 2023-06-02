import axios, { AxiosRequestConfig } from 'axios'
import { Logger } from '@crowd/logging'
import { PlatformType } from '@crowd/types'
import { RedditGetPostsInput, RedditPostsResponse } from '../../types/redditTypes'
import getToken from '../nango/getToken'

/**
 * Get paginated posts from a subreddit
 * @param input RedditGetPostsInput. Made of a Nango ID to get the auth token, and a subreddit.
 * @param logger Logger instance for structured logging
 * @returns A reddit API response containing the posts in a subreddit.
 */
async function getPosts(input: RedditGetPostsInput, logger: Logger): Promise<RedditPostsResponse> {
  try {
    logger.info({ message: 'Fetching posts from a sub-reddit', input })

    // Wait for 1.5s for rate limits.
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Gett an access token from Nango
    const accessToken = await getToken(input.nangoId, PlatformType.REDDIT, logger)

    const config: AxiosRequestConfig<any> = {
      method: 'get',
      url: `http://oauth.reddit.com/r/${input.subreddit}/new.json`,
      params: {
        limit: 100,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }

    // If a pagination token was sent, add it to the request
    if (input.after) {
      config.params.after = input.after
    }

    const response: RedditPostsResponse = (await axios(config)).data
    return response
  } catch (err) {
    logger.error({ err, input }, 'Error while getting posts in subreddit')
    throw err
  }
}

export default getPosts
