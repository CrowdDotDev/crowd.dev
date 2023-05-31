import axios, { AxiosRequestConfig } from 'axios'
import { Logger } from '@crowd/logging'
import { timeout } from '@crowd/common'
import {
  StackOverflowGetQuestionsByKeywordInput,
  StackOverflowQuestionsResponse,
} from '../../types/stackOverflowTypes'
import { STACKEXCHANGE_CONFIG } from '../../../../conf'
import getToken from '../nango/getToken'
import { RateLimitError } from '../../../../types/integration/rateLimitError'

/**
 * Get paginated questions from StackOverflow given a keyword.
 * @param input StackOverflowGetQuestionsByKeywordInput. Made of a Nango ID to get the auth token, and a keyword.
 * @param logger Logger instance for structured logging
 * @returns A Stack Overflow API response containing the posts with this keyword.
 */
async function getQuestions(
  input: StackOverflowGetQuestionsByKeywordInput,
  logger: Logger,
): Promise<StackOverflowQuestionsResponse> {
  try {
    logger.info({ message: 'Fetching questions by keywords from StackOverflow', input })

    // Gett an access token from Nango
    const accessToken = await getToken(input.nangoId, 'stackexchange', logger)

    const config: AxiosRequestConfig<any> = {
      method: 'get',
      url: `https://api.stackexchange.com/2.3/search/advanced`,
      params: {
        page: input.page,
        page_size: 100,
        order: 'desc',
        sort: 'creation',
        q: `"${input.keyword}"`,
        site: 'stackoverflow',
        filter: 'withbody',
        access_token: accessToken,
        key: STACKEXCHANGE_CONFIG.key,
      },
    }

    const response: StackOverflowQuestionsResponse = (await axios(config)).data
    const backoff = response.backoff
    if (backoff) {
      if (backoff <= 2) {
        // Wait for backoff time returned by StackOverflow API
        await timeout(backoff * 1000)
      } else {
        throw new RateLimitError(backoff, 'stackoverflow/getQuestionsByKeyword')
      }
    }
    return response
  } catch (err) {
    logger.error({ err, input }, 'Error while getting StackOverflow questions by keywords')
    throw err
  }
}

export default getQuestions
