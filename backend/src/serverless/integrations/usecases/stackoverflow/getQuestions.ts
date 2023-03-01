import axios, { AxiosRequestConfig } from 'axios'
import { StackOverflowGetQuestionsInput, StackOverflowQuestionsResponse } from '../../types/stackOverflowTypes'
import { Logger } from '../../../../utils/logging'
import { PlatformType } from '../../../../types/integrationEnums'
import getToken from '../pizzly/getToken'

/**
 * Get paginated questions from StackOverflow given a set of tags
 * @param input RedditGetPostsInput. Made of a Pizzly ID to get the auth token, and a subreddit.
 * @param logger Logger instance for structured logging
 * @returns A reddit API response containing the posts in a subreddit.
 */
async function getQuestions(input: StackOverflowGetQuestionsInput, logger: Logger): Promise<StackOverflowQuestionsResponse> {
  try {
    logger.info({ message: 'Fetching questions from StackOverflow', input })

    // Wait for 1.5s for rate limits.
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 1500))

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

    const response: StackOverflowQuestionsResponse = (await axios(config)).data
    return response
  } catch (err) {
    logger.error({ err, input }, 'Error while getting StackOverflow questions tagged with tags')
    throw err
  }
}

export default getQuestions;
