import axios, { AxiosRequestConfig } from 'axios'
import { RedditGetCommentsInput, RedditCommentsResponse } from '../../types/redditTypes'
import { Logger } from '../../../../utils/logging'
import { PlatformType } from '../../../../types/integrationEnums'
import getToken from '../pizzly/getToken'

async function getPosts(
  input: RedditGetCommentsInput,
  logger: Logger,
): Promise<RedditCommentsResponse> {
  try {
    logger.info({ message: 'Fetching posts from a sub-reddit', input })

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

export default getPosts
