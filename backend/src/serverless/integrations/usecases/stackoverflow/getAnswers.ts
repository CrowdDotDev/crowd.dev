import axios, { AxiosRequestConfig } from 'axios'
import { StackOverflowAnswersInput, StackOverflowAnswerResponse, StackOverflowAnswer } from '../../types/stackOverflowTypes'
import { Logger } from '../../../../utils/logging'
import getToken from '../nango/getToken'
import { timeout } from '../../../../utils/timing';
import { RateLimitError } from '../../../../types/integration/rateLimitError'
import { STACKEXCHANGE_CONFIG } from '../../../../config'

/**
 * Get paginated questions from StackOverflow given a set of tags
 * @param input StackOverflowAnswersInput. Made of a Pizzly ID to get the auth token, and a question_ids.
 * @param logger Logger instance for structured logging
 * @returns A StackOverflow API response containing the answers corresponding to a question with question_id.
 */
async function getAnswers(input: StackOverflowAnswersInput, logger: Logger): Promise<StackOverflowAnswerResponse> {
  try {
    logger.info({ message: 'Fetching answers from StackOverflow', input })

    // Gett an access token from Pizzly
    const accessToken = await getToken(input.nangoId, 'stackexchange', logger)

    // we sort by creation date ascending (old first), so we can get the first answer and then relate answers to each other based on their order
    const config: AxiosRequestConfig<any> = {
      method: 'get',
      url: `https://api.stackexchange.com/2.3/questions/${input.questionId}/answers`,
      params: {
        page: input.page,
        page_size: 100,
        order: 'desc',
        sort: 'creation',
        site: 'stackoverflow',
        filter: 'withbody',
        access_token: accessToken,
        key: STACKEXCHANGE_CONFIG.key,
      }
    }

    const response: StackOverflowAnswerResponse = (await axios(config)).data;
    const backoff = response.backoff;
    if (backoff) {
      if (backoff <= 2) {
        // Wait for backoff time returned by StackOverflow API
        // eslint-disable-next-line no-promise-executor-return
        await timeout(backoff * 1000);
      }
      else {
        throw new RateLimitError(backoff, "stackoverflow/getAnswers");
      }
    }
    return response;
  } catch (err) {
    logger.error({ err, input }, 'Error while getting StackOverflow answers corresponding to a question')
    throw err
  }
}

export default getAnswers;
