import axios, { AxiosRequestConfig } from 'axios'
import { RedditGetPostsInput, RedditPostsResponse } from '../../types/redditTypes'
import { Logger } from '../../../../utils/logging'
import { PlatformType } from '../../../../types/integrationEnums'
import getToken from '../pizzly/getToken'

async function getPosts(input: RedditGetPostsInput, logger: Logger): Promise<RedditPostsResponse> {
  try {
    logger.info({ message: 'Fetching posts from a sub-reddit', input })

    const access_token = await getToken(input.pizzlyId, PlatformType.REDDIT, logger)

    const config: AxiosRequestConfig<any> = {
      method: 'get',
      url: `http://oauth.reddit.com/r/${input.subreddit}/new.json`,
      params: {
        limit: 100,
      },
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }

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
