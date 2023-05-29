import axios, { AxiosRequestConfig } from 'axios'
import { Logger } from '@crowd/logging'
import { timeout } from '@crowd/common'
import {
  StackOverflowGetQuestionsInput,
  StackOverflowQuestionsResponse,
} from '../../types/stackOverflowTypes'
import { STACKEXCHANGE_CONFIG } from '../../../../conf'
import getToken from '../nango/getToken'
import { RateLimitError } from '../../../../types/integration/rateLimitError'

/**
 * Get paginated questions from StackOverflow given a set of tags or just one tags. In case of multiple tags, the questions will be tagged with all of them.
 * @param input StackOverflowGetQuestionsInput. Made of a Nango ID to get the auth token, and array of tags (even if only one tag).
 * @param logger Logger instance for structured logging
 * @returns A StackOveflow API response containing the posts with these tags.
 */
async function getQuestions(
  input: StackOverflowGetQuestionsInput,
  logger: Logger,
): Promise<StackOverflowQuestionsResponse> {
  try {
    logger.info({ message: 'Fetching questions from StackOverflow', input })

    // Gett an access token from Nango
    const accessToken = await getToken(input.nangoId, 'stackexchange', logger)

    const config: AxiosRequestConfig<any> = {
      method: 'get',
      url: `https://api.stackexchange.com/2.3/questions`,
      params: {
        page: input.page,
        page_size: 100,
        order: 'desc',
        sort: 'creation',
        tagged: input.tags.join(';'),
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
        throw new RateLimitError(backoff, 'stackoverflow/getQuestions')
      }
    }
    return response
  } catch (err) {
    logger.error({ err, input }, 'Error while getting StackOverflow questions tagged with tags')
    throw err
  }
}

export default getQuestions
