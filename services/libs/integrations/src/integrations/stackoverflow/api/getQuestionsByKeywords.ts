import axios, { AxiosRequestConfig } from 'axios'
import { timeout } from '@crowd/common'
import { RateLimitError } from '@crowd/types'
import { getNangoToken } from 'src/integrations/nango'
import { IProcessStreamContext } from 'src/types'
import {
  StackOverflowPlatformSettings,
  StackOverflowQuestionsResponse,
  StackOverflowGetQuestionsByKeywordInput,
} from '../types'

/**
 * Get paginated questions from StackOverflow given a keyword.
 * @param input StackOverflowGetQuestionsByKeywordInput. Made of a Nango ID to get the auth token, and a keyword.
 * @param logger Logger instance for structured logging
 * @returns A Stack Overflow API response containing the posts with this keyword.
 */
async function getQuestions(
  input: StackOverflowGetQuestionsByKeywordInput,
  ctx: IProcessStreamContext,
): Promise<StackOverflowQuestionsResponse> {
  try {
    ctx.log.info({ message: 'Fetching questions by keywords from StackOverflow', input })

    // Gett an access token from Nango
    const accessToken = await getNangoToken(input.nangoId, 'stackexchange', ctx)

    const platformSettings = ctx.platformSettings as StackOverflowPlatformSettings
    const key = platformSettings.key

    const config: AxiosRequestConfig = {
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
        key,
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
    ctx.log.error({ err, input }, 'Error while getting StackOverflow questions by keywords')
    throw err
  }
}

export default getQuestions
