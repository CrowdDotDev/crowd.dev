import axios, { AxiosRequestConfig } from 'axios'
import { StackOverflowAnswersInput, StackOverflowAnswerResponse, StackOverflowAnswer } from '../../types/stackOverflowTypes'
import { Logger } from '../../../../utils/logging'
import { PlatformType } from '../../../../types/integrationEnums'
import getToken from '../pizzly/getToken'

/**
 * Get paginated questions from StackOverflow given a set of tags
 * @param input RedditGetPostsInput. Made of a Pizzly ID to get the auth token, and a subreddit.
 * @param logger Logger instance for structured logging
 * @returns A reddit API response containing the posts in a subreddit.
 */
async function getAnswers(input: StackOverflowAnswersInput, logger: Logger): Promise<StackOverflowAnswerResponse> {
  try {
    logger.info({ message: 'Fetching answers from StackOverflow', input })

    // Gett an access token from Pizzly
    // const accessToken = await getToken(input.pizzlyId, PlatformType.REDDIT, logger)

    // we sort by creation date ascending (old first), so we can get the first answer and then relate answers to each other based on their order
    const config: AxiosRequestConfig<any> = {
      method: 'get',
      url: `https://api.stackexchange.com/2.3/questions/${input.questionId}/answers`,
      params: {
        page: input.page,
        page_size: 100,
        order: 'asc',
        sort: 'creation',
        site: 'stackoverflow',
        filter: 'withbody',
      },
    //   headers: {
    //     Authorization: `Bearer ${accessToken}`,
    //   },
    }

    const response: StackOverflowAnswerResponse = (await axios(config)).data;
    const backoff = response.backoff;
    if (backoff) {
        await new Promise((resolve) => setTimeout(resolve, backoff * 1000));
    }
    return response;
  } catch (err) {
    logger.error({ err, input }, 'Error while getting StackOverflow answers corresponding to a question')
    throw err
  }
}

export default getAnswers;
