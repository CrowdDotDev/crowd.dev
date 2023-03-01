import axios, { AxiosRequestConfig } from 'axios'
import { StackOverflowUserResponse, StackOverflowUser } from '../../types/stackOverflowTypes'
import { Logger } from '../../../../utils/logging'
import { PlatformType } from '../../../../types/integrationEnums'
import getToken from '../pizzly/getToken'

/**
 * Get paginated questions from StackOverflow given a set of tags
 * @param input RedditGetPostsInput. Made of a Pizzly ID to get the auth token, and a subreddit.
 * @param logger Logger instance for structured logging
 * @returns A reddit API response containing the posts in a subreddit.
 */
async function getUser(user_id: number, logger: Logger): Promise<StackOverflowUser> {
  try {
    logger.info({ message: 'Fetching a member from StackOverflow', user_id })

    // Gett an access token from Pizzly
    // const accessToken = await getToken(input.pizzlyId, PlatformType.REDDIT, logger)

    const config: AxiosRequestConfig<any> = {
      method: 'get',
      url: `https://api.stackexchange.com/2.3/users/${user_id}`,
      params: {
        site: 'stackoverflow',
      },
    //   headers: {
    //     Authorization: `Bearer ${accessToken}`,
    //   },
    }

    const response: StackOverflowUserResponse = (await axios(config)).data;
    const backoff = response.backoff;
    if (backoff) {
        // Wait for backoff time returned by StackOverflow API
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, backoff * 1000))
    }
    return response.items[0];
  } catch (err) {
    logger.error({ err, user_id }, 'Error while getting a member from StackOverflow API')
    throw err
  }
}

export default getUser;
