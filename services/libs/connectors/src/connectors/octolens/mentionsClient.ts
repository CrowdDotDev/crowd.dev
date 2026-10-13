import axios, { AxiosResponse } from 'axios'

import { timeout } from '@crowd/common'

import {
  ConnectorError,
  ProviderContractError,
  ProviderUnavailableError,
  RateLimitError,
  errorFromHttpStatus,
} from '../../http/errors'

export const OCTOLENS_REQUEST_TIMEOUT_MS = 30_000
const OCTOLENS_API_BASE_URL = 'https://app.octolens.com/api/v2'
const MENTIONS_PAGE_SIZE = 100
// Only retries provider.unavailable (5xx/network); rate-limit and auth errors bubble up
// immediately so the dispatcher parks the whole sync_unit instead of retrying in-process.
const MAX_ATTEMPTS = 4
const BACKOFF_BASE_MS = 1_000
const BACKOFF_CAP_MS = 10_000

export interface OctolensMention {
  id: number
  sourceId: string
  url: string
  title: string | null
  body: string | null
  source: string
  timestamp: string
  author: string | null
  authorName: string | null
  authorUrl: string | null
  authorAvatar: string | null
  authorFollowers: number | null
  relevance: 'relevant' | 'not_relevant'
  relevanceComment: string | null
  sentiment: 'Positive' | 'Neutral' | 'Negative' | null
  language: string | null
  tags: string[]
  keywords: OctolensMentionKeyword[]
  engaged: boolean
  isReply: boolean
  review?: OctolensMentionReview
  relevanceScore?: number | null
  feedbackRelevant?: number
  imageUrl?: string | null
  engagementMetrics?: Record<string, number>
  engagementObservedAt?: string | null
  // Optional per Octolens's spec (denormalized from the first entry of `keywords[]`, which
  // is required but could in principle be empty) — never assume it's present.
  keywordId?: number
}

export interface OctolensMentionKeyword {
  id: number
  keyword: string
  keywordTag?: string
}

export interface OctolensMentionReview {
  rating: number
  ratingMax: number
  verified: boolean | null
  response: string | null
  responseAt: string | null
  targetName: string | null
}

export interface OctolensMentionsPage {
  data: OctolensMention[]
  nextCursor: string | null
}

export async function fetchMentionsPage(
  token: string,
  params: { startDate?: string; cursor?: string },
): Promise<OctolensMentionsPage> {
  let lastError: ConnectorError | undefined
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await requestMentionsPage(token, params)
    } catch (err) {
      if (!(err instanceof ConnectorError) || err.errorClass !== 'provider.unavailable') {
        throw err
      }
      lastError = err
      if (attempt < MAX_ATTEMPTS) {
        await timeout(Math.min(BACKOFF_BASE_MS * 2 ** (attempt - 1), BACKOFF_CAP_MS))
      }
    }
  }
  throw lastError
}

async function requestMentionsPage(
  token: string,
  params: { startDate?: string; cursor?: string },
): Promise<OctolensMentionsPage> {
  // validateStatus below only covers a received 4xx/5xx response — a connection failure
  // (refused/timeout/DNS) rejects as a plain Axios error unless wrapped here.
  let response: AxiosResponse
  try {
    response = await axios.post(
      `${OCTOLENS_API_BASE_URL}/mentions`,
      {
        limit: MENTIONS_PAGE_SIZE,
        cursor: params.cursor,
        filters: params.startDate ? { startDate: params.startDate } : undefined,
        // Defaults to false (relevance-filtered); since the watermark advances over whatever
        // this returns, a filtered-out mention would be permanently skipped, not just delayed.
        includeAll: true,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: OCTOLENS_REQUEST_TIMEOUT_MS,
        validateStatus: () => true,
      },
    )
  } catch (err) {
    throw new ProviderUnavailableError('no response from octolens', { cause: err })
  }

  if (response.status === 429) {
    throw new RateLimitError(`octolens rate limited (status ${response.status})`, {
      status: response.status,
      resumeAt: computeResumeAt(response.headers as Record<string, string>),
    })
  }
  if (response.status >= 300) {
    throw errorFromHttpStatus(response.status, `octolens mentions request failed`)
  }

  const body = response.data as Partial<{
    data: OctolensMention[]
    pagination: Partial<{ nextCursor: string | null }>
  }>
  const nextCursor = body.pagination?.nextCursor
  // An omitted field or an empty string both decode falsy, same as null — runMentionPoll's
  // `!page.nextCursor` would wrongly treat either as drained, so only null or a real cursor passes.
  if (
    !Array.isArray(body.data) ||
    !(nextCursor === null || (typeof nextCursor === 'string' && nextCursor.length > 0))
  ) {
    throw new ProviderContractError('octolens mentions response missing data/pagination')
  }
  return { data: body.data, nextCursor }
}

// Octolens's hourly cap resets on a fixed UTC-hour bucket, not a rolling window, so
// Retry-After is the precise signal; X-RateLimit-Reset is the fallback.
function computeResumeAt(headers: Record<string, string>): Date {
  const retryAfterSeconds = Number(headers['retry-after'])
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return new Date(Date.now() + retryAfterSeconds * 1000)
  }
  const resetEpochSeconds = Number(headers['x-ratelimit-reset'])
  if (Number.isFinite(resetEpochSeconds) && resetEpochSeconds * 1000 > Date.now()) {
    return new Date(resetEpochSeconds * 1000)
  }
  return new Date(Date.now() + 60_000)
}
