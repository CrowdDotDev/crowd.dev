import axios, { AxiosRequestConfig } from 'axios'

import { timeout } from '@crowd/common'
import { RateLimitError } from '@crowd/types'

import { IProcessStreamContext } from '../../../types'
import { getNangoToken } from '../../nango'
import {
  STACKOVERFLOW_LAST_MAX_PAGES,
  STACKOVERFLOW_MAX_RETROSPECT_IN_HOURS,
  StackOverflowGetQuestionsInput,
  StackOverflowPlatformSettings,
  StackOverflowQuestionsResponse,
} from '../types'

/**
 * Get paginated questions from StackOverflow given a set of tags or just one tags. In case of multiple tags, the questions will be tagged with all of them.
 * @param input StackOverflowGetQuestionsInput. Made of a Nango ID to get the auth token, and array of tags (even if only one tag).
 * @param logger Logger instance for structured logging
 * @returns A StackOveflow API response containing the posts with these tags.
 */
async function getQuestions(
  input: StackOverflowGetQuestionsInput,
  ctx: IProcessStreamContext,
): Promise<StackOverflowQuestionsResponse> {
  try {
    ctx.log.info({ message: 'Fetching questions from StackOverflow', input })

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
          now.getUTCHours() - STACKOVERFLOW_MAX_RETROSPECT_IN_HOURS,
        ),
      )
      fromTimestamp = Math.floor(fromDate.getTime() / 1000)
    }

    const platformSettings = ctx.platformSettings as StackOverflowPlatformSettings
    const key = platformSettings.key

    // Get access token from Nango
    let accessToken = null
    try {
      accessToken = await getNangoToken(input.nangoId, 'stackexchange', ctx)
    } catch (err) {
      ctx.log.warn(
        { err },
        'Failed to get stackoverflow access_token from nango, using global key for stackexchange',
      )
    }

    const params: Record<string, unknown> = {
      page: input.page,
      page_size: 100,
      order: 'desc',
      sort: 'creation',
      tagged: input.tags.join(';'),
      site: 'stackoverflow',
      filter: 'withbody',
      fromdate: fromTimestamp,
      todate: toDate,
      key,
    }
    if (accessToken) {
      params.access_token = accessToken
    }

    const config: AxiosRequestConfig = {
      method: 'get',
      url: `https://api.stackexchange.com/2.3/questions`,
      params,
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

    // If we are onboarding, we want to get the last MAX_PAGES pages of questions
    if (isOnboarding) {
      if (input.page < STACKOVERFLOW_LAST_MAX_PAGES) {
        return response
      } else {
        response.has_more = false
        return response
      }
    }

    return response
  } catch (err) {
    ctx.log.error({ err, input }, 'Error while getting StackOverflow questions tagged with tags')
    throw err
  }
}

export default getQuestions
