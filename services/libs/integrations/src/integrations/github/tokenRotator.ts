import { ICache } from '@crowd/types'
import axios from 'axios'
import { RateLimitError } from '@crowd/types'
import { getServiceChildLogger } from '@crowd/logging'

const logger = getServiceChildLogger('github.tokenRotator')

interface TokenInfo {
  token: string
  remaining: number
  reset: number
}

const highPrioiryIntegrations = [
  // // tiptap
  // '20147429-c1b7-4ff6-a19b-8306527e7ae3',
  // // plane
  // 'f2b2c42e-76aa-4b0f-a70c-ecc3745d4f15',
  // // superset
  // '2c6283c2-0a79-4d87-b62b-334a4876fe1c',
  // // qdrant
  '2c79e053-2578-434f-92df-35b5e76a18a8',
]

export class GithubTokenRotator {
  static CACHE_KEY = 'integration-cache:github-token-rotator:tokens'
  constructor(private cache: ICache, private tokens: string[]) {
    this.cache = cache
    this.tokens = [...new Set(tokens)]
    this.initializeTokens()
  }

  private async initializeTokens(): Promise<void> {
    for (const token of this.tokens) {
      const tokenInfo: TokenInfo = JSON.parse(
        await this.cache.hget(GithubTokenRotator.CACHE_KEY, token),
      )
      if (!tokenInfo) {
        const newTokenInfo: TokenInfo = {
          token,
          remaining: 0,
          reset: 0,
        }
        await this.cache.hset(GithubTokenRotator.CACHE_KEY, token, JSON.stringify(newTokenInfo))
      }
    }
  }

  public async getToken(integrationId: string, err?: any): Promise<string | null> {
    const tokens = await this.cache.hgetall(GithubTokenRotator.CACHE_KEY)
    let minResetTime = Infinity

    if (!highPrioiryIntegrations.includes(integrationId)) {
      if (err) {
        logger.info(err, { integrationId }, 'Low priority integration, throwing original error')
        throw err
      } else {
        logger.info(
          err,
          { integrationId },
          'Low priority integration, throwing no avaliable tokens error',
        )
        throw new Error('No available tokens for low priority integration')
      }
    }

    for (const token in tokens) {
      const tokenInfo: TokenInfo = JSON.parse(tokens[token])
      if (tokenInfo.remaining > 0 || tokenInfo.reset < Math.floor(Date.now() / 1000)) {
        await this.cache.hset(GithubTokenRotator.CACHE_KEY, token, JSON.stringify(tokenInfo))
        return token
      }
      minResetTime = Math.min(minResetTime, tokenInfo.reset)
    }

    const waitTime =
      minResetTime - Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 120) + 60

    // if we have to wait less than 60 seconds, let's wait and try again
    if (waitTime <= 60) {
      return new Promise((resolve) => {
        setTimeout(async () => {
          resolve(await this.getToken(integrationId))
        }, waitTime * 1000)
      })
    }

    throw new RateLimitError(
      waitTime + Math.floor(Math.random() * 120) + 60,
      'token-rotator',
      `No available tokens in GitHubTokenRotator. Please wait for ${waitTime} seconds`,
    )
  }

  public async updateTokenInfo(token: string, remaining: number, reset: number): Promise<void> {
    const tokenInfo: TokenInfo = JSON.parse(
      (await this.cache.hget(GithubTokenRotator.CACHE_KEY, token)) || '',
    )
    if (tokenInfo) {
      tokenInfo.remaining = remaining
      tokenInfo.reset = reset
      await this.cache.hset(GithubTokenRotator.CACHE_KEY, token, JSON.stringify(tokenInfo))
    }
  }

  public async updateRateLimitInfoFromApi(token: string): Promise<void> {
    // let's make API call to get the latest rate limit info
    const tokenInfo: TokenInfo = JSON.parse(
      (await this.cache.hget(GithubTokenRotator.CACHE_KEY, token)) || '',
    )
    if (tokenInfo) {
      const response = await axios({
        url: 'https://api.github.com/rate_limit',
        method: 'get',
        headers: { Authorization: `token ${token}` },
      })

      const remaining = parseInt(response.data.resources.graphql.remaining)
      const reset = parseInt(response.data.resources.graphql.reset)
      await this.updateTokenInfo(token, remaining, reset)
    }
  }
}
