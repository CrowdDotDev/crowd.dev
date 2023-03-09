import axios, { AxiosRequestConfig } from 'axios'
import { StackOverflowUserResponse, StackOverflowUser } from '../../types/stackOverflowTypes'
import { Logger } from '../../../../utils/logging'
import { STACKEXCHANGE_CONFIG } from '../../../../config';
import getToken from '../nango/getToken';
import { timeout } from '../../../../utils/timing';
import { RateLimitError } from '../../../../types/integration/rateLimitError';
import { StackOverflowUserInput } from '../../types/stackOverflowTypes';

/**
 * Get paginated questions from StackOverflow given a set of tags
 * @param input RedditGetPostsInput. Made of a Pizzly ID to get the auth token, and a subreddit.
 * @param logger Logger instance for structured logging
 * @returns A reddit API response containing the posts in a subreddit.
 */
async function getUser(input: StackOverflowUserInput, logger: Logger): Promise<StackOverflowUser> {
  try {
    logger.info({ message: 'Fetching a member from StackOverflow', userId: input.userId })

    // Gett an access token from Pizzly
    const accessToken = await getToken(input.nangoId, 'stackexchange', logger)

    const config: AxiosRequestConfig<any> = {
      method: 'get',
      url: `https://api.stackexchange.com/2.3/users/${input.userId}`,
      params: {
        site: 'stackoverflow',
        access_token: accessToken,
        key: STACKEXCHANGE_CONFIG.key,
      },
    }

    const response: StackOverflowUserResponse = (await axios(config)).data;
    const backoff = response.backoff;
    if (backoff !== undefined) {
      if (backoff <= 2) {
        // Wait for backoff time returned by StackOverflow API
        await timeout(backoff * 1000);
      }
      else {
        throw new RateLimitError(backoff, "stackoverflow/getUser");
      }
    }
    return response.items[0];
  } catch (err) {
    logger.error({ err, userId: input.userId }, 'Error while getting a member from StackOverflow API')
    throw err
  }
}

export default getUser;
