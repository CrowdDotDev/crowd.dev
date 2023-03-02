import axios, { AxiosRequestConfig } from 'axios'
import { StackOverflowGetQuestionsInput, StackOverflowQuestionsResponse } from '../../types/stackOverflowTypes'
import { Logger } from '../../../../utils/logging'
import { PlatformType } from '../../../../types/integrationEnums'
import getToken from '../nango/getToken'
import { timeout } from '../../../../utils/timing';
import { RateLimitError } from '../../../../types/integration/rateLimitError';

/**
 * Get paginated questions from StackOverflow given a set of tags
 * @param input RedditGetPostsInput. Made of a Pizzly ID to get the auth token, and a subreddit.
 * @param logger Logger instance for structured logging
 * @returns A reddit API response containing the posts in a subreddit.
 */
async function getQuestions(input: StackOverflowGetQuestionsInput, logger: Logger): Promise<StackOverflowQuestionsResponse> {
  try {
    logger.info({ message: 'Fetching questions from StackOverflow', input })

    // Gett an access token from Pizzly
    // const accessToken = await getToken(input.pizzlyId, PlatformType.REDDIT, logger)

    const config: AxiosRequestConfig<any> = {
      method: 'get',
      url: `https://api.stackexchange.com/2.3/questions`,
      params: {
        page: input.page,
        page_size: 100,
        order: 'desc',
        sort: 'activity',
        tagged: input.tags.join(';'),
        site: 'stackoverflow',
        filter: 'withbody',
      },
    //   headers: {
    //     Authorization: `Bearer ${accessToken}`,
    //   },
    }

    const response: StackOverflowQuestionsResponse = (await axios(config)).data;
    const backoff = response.backoff;
    if (backoff) {
      if (backoff <= 2) {
        // Wait for backoff time returned by StackOverflow API
        await timeout(backoff * 1000);
      }
      else {
        throw new RateLimitError(backoff * 1000, "stackoverflow/getQuestions");
      }
    }
    return response;
  } catch (err) {
    logger.error({ err, input }, 'Error while getting StackOverflow questions tagged with tags')
    throw err
  }
}

export default getQuestions;
