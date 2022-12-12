import axios, { AxiosRequestConfig } from 'axios'
import { RedditMoreCommentsInput, RedditMoreCommentsResponse } from '../../types/redditTypes'
import { Logger } from '../../../../utils/logging'
import { PlatformType } from '../../../../types/integrationEnums'
import getToken from '../pizzly/getToken'

async function getMoreComments(
  input: RedditMoreCommentsInput,
  logger: Logger,
): Promise<RedditMoreCommentsResponse> {
  try {
    logger.info({ message: 'Fetching more comments from a sub-reddit', input })

    // Wait for 1.5seconds, remove this later
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const access_token = await getToken(input.pizzlyId, PlatformType.REDDIT, logger)

    const config: AxiosRequestConfig<any> = {
      method: 'get',
      url: `http://oauth.reddit.com/api/morechildren?api_type=json`,
      params: {
        depth: 99,
        link_id: input.linkId,
        children: input.children,
      },
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }

    const response: RedditMoreCommentsResponse = (await axios(config)).data
    return response
  } catch (err) {
    logger.error({ err, input }, 'Error while getting posts in subreddit')
    throw err
  }
}

export default getMoreComments
