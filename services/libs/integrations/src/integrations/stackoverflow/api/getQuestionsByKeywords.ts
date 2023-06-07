import axios, { AxiosRequestConfig } from 'axios'
import { timeout } from '@crowd/common'
import { RateLimitError } from '@crowd/types'
import { getNangoToken } from '../../nango'
import { IProcessStreamContext } from '@/types'
import {
  StackOverflowPlatformSettings,
  StackOverflowQuestionsResponse,
  StackOverflowGetQuestionsByKeywordInput,
  STACKOVERFLOW_LAST_MAX_PAGES,
  STACKOVERFLOW_MAX_RETROSPECT_IN_HOURS,
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

    const isOnboarding = ctx.onboarding

    let now: Date = null
    let toDate: number = null
    let fromDate: Date = null
    let fromTimestamp: number = null

    if (!isOnboarding) {
      now = new Date()
      toDate = Math.floor(now.getTime() / 1000) // Unix timestamp for now
      fromDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours() - STACKOVERFLOW_LAST_MAX_PAGES,
        ),
      )
      fromTimestamp = Math.floor(fromDate.getTime() / 1000)
    }

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
        fromdate: fromTimestamp,
        todate: toDate,
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

    // If we are onboarding, we want to get the last MAX_PAGES pages of questions
    if (isOnboarding) {
      if (input.page < STACKOVERFLOW_LAST_MAX_PAGES) {
        return response
      } else {
        response.has_more = false
        return response
      }
    }
  } catch (err) {
    ctx.log.error({ err, input }, 'Error while getting StackOverflow questions by keywords')
    throw err
  }
}

export default getQuestions
