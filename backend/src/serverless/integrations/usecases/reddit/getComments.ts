import axios, { AxiosRequestConfig } from 'axios'
import { RedditGetCommentsInput, RedditCommentsResponse } from '../../types/redditTypes'
import { Logger } from '../../../../utils/logging'
import { PlatformType } from '../../../../types/integrationEnums'
import getToken from '../pizzly/getToken'

/**
 * Get the comment tree of a post.
 * @param input The input to get comments. It needs a Pizzly ID, the subreddit where the post was posted, and the post's ID
 * @param logger A logger instance for structured logging
 * @returns The Reddit API response of getting comments from a post
 */
async function getComments(
  input: RedditGetCommentsInput,
  logger: Logger,
): Promise<RedditCommentsResponse> {
  try {
    logger.info({ message: 'Fetching comments from a post in a sub-reddit', input })

    // Wait for 1.5s for rate limits.
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Gett an access token from Pizzly
    const access_token = await getToken(input.pizzlyId, PlatformType.REDDIT, logger)

    const config: AxiosRequestConfig<any> = {
      method: 'get',
      url: `http://oauth.reddit.com/r/${input.subreddit}/comments/${input.postId}.json`,
      params: {
        limit: 100,
      },
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }

    const response: RedditCommentsResponse = (await axios(config)).data
    return response
  } catch (err) {
    logger.error({ err, input }, 'Error while getting posts in subreddit')
    throw err
  }
}

export default getComments
