import axios, { AxiosRequestConfig } from 'axios'
import { timeout } from '@crowd/common'
import { RateLimitError } from '@crowd/types'
import { getNangoToken } from '../../nango'
import { IProcessStreamContext } from '../../../types'
import {
  StackOverflowPlatformSettings,
  StackOverflowUser,
  StackOverflowUserInput,
  StackOverflowUserResponse,
} from '../types'

/**
 * Get user from StackOverflow given a user ID.
 * @param input StackOverflowUserInput. Made of a Nango ID to get the auth token, and a userID.
 * @param logger Logger instance for structured logging
 * @returns A Stack Overflow API response containing the user.
 */
async function getUser(
  input: StackOverflowUserInput,
  ctx: IProcessStreamContext,
): Promise<StackOverflowUser> {
  try {
    ctx.log.info({ message: 'Fetching a member from StackOverflow', userId: input.userId })

    // Gett an access token from Pizzly
    const accessToken = await getNangoToken(input.nangoId, 'stackexchange', ctx)

    const platformSettings = ctx.platformSettings as StackOverflowPlatformSettings
    const key = platformSettings.key

    const config: AxiosRequestConfig = {
      method: 'get',
      url: `https://api.stackexchange.com/2.3/users/${input.userId}`,
      params: {
        site: 'stackoverflow',
        access_token: accessToken,
        key,
        filter: '!b8M4F5DX_TlrUr',
      },
    }

    const response: StackOverflowUserResponse = (await axios(config)).data
    const backoff = response.backoff
    if (backoff !== undefined) {
      if (backoff <= 2) {
        // Wait for backoff time returned by StackOverflow API
        await timeout(backoff * 1000)
      } else {
        throw new RateLimitError(backoff, 'stackoverflow/getUser')
      }
    }
    return response.items[0]
  } catch (err) {
    ctx.log.error(
      { err, userId: input.userId },
      'Error while getting a member from StackOverflow API',
    )
    throw err
  }
}

export default getUser
