import { ICache } from '@crowd/types'
import axios from 'axios'

interface TokenInfo {
  token: string
  remaining: number
  reset: number
  inUse: boolean
}

export class GithubTokenRotator {
  constructor(private cache: ICache, private tokens: string[]) {
    this.cache = cache
    this.tokens = [...new Set(tokens)]
    this.initializeTokens()
  }

  private async initializeTokens(): Promise<void> {
    for (const token of this.tokens) {
      const tokenInfo: TokenInfo = JSON.parse(await this.cache.hget('github:tokens', token))
      if (!tokenInfo) {
        const newTokenInfo: TokenInfo = {
          token,
          remaining: 0,
          reset: 0,
          inUse: false,
        }
        await this.cache.hset('github:tokens', token, JSON.stringify(newTokenInfo))
      }
    }
  }

  public async getToken(): Promise<string | null> {
    const tokens = await this.cache.hgetall('github:tokens')
    for (const token in tokens) {
      const tokenInfo: TokenInfo = JSON.parse(tokens[token])
      if (
        !tokenInfo.inUse &&
        (tokenInfo.remaining > 0 || tokenInfo.reset < Math.floor(Date.now() / 1000))
      ) {
        tokenInfo.inUse = true
        await this.cache.hset('github:tokens', token, JSON.stringify(tokenInfo))
        return token
      }
    }
    throw new Error('No available tokens in GitHubTokenRotator')
  }

  public async returnToken(token: string): Promise<void> {
    const tokenInfo: TokenInfo = JSON.parse((await this.cache.hget('github:tokens', token)) || '')
    if (tokenInfo) {
      tokenInfo.inUse = false
      await this.cache.hset('github:tokens', token, JSON.stringify(tokenInfo))
    }
  }

  public async updateTokenInfo(token: string, remaining: number, reset: number): Promise<void> {
    const tokenInfo: TokenInfo = JSON.parse((await this.cache.hget('github:tokens', token)) || '')
    if (tokenInfo) {
      tokenInfo.remaining = remaining
      tokenInfo.reset = reset
      await this.cache.hset('github:tokens', token, JSON.stringify(tokenInfo))
    }
  }

  public async updateRateLimitInfoFromApi(token: string): Promise<void> {
    // let's make API call to get the latest rate limit info
    const tokenInfo: TokenInfo = JSON.parse((await this.cache.hget('github:tokens', token)) || '')
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

  //   public async apiRequest(
  //     url: string,
  //     method: 'get' | 'post' | 'put' | 'delete',
  //     data?: any,
  //   ): Promise<any> {
  //     const token = await this.getToken()
  //     if (!token) {
  //       throw new Error('No available tokens')
  //     }

  //     try {
  //       const response = await axios({
  //         url,
  //         method,
  //         data,
  //         headers: { Authorization: `token ${token}` },
  //       })

  //       const remaining = parseInt(response.headers['x-ratelimit-remaining'])
  //       const reset = parseInt(response.headers['x-ratelimit-reset'])
  //       await this.updateTokenInfo(token, remaining, reset)

  //       return response.data
  //     } finally {
  //       await this.returnToken(token)
  //     }
  //   }
}
