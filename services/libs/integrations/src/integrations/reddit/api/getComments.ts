import axios, { AxiosRequestConfig } from 'axios'
import { getNangoToken } from '../../nango'
import { IProcessStreamContext } from '@/types'
import { PlatformType } from '@crowd/types'
import { RedditGetCommentsInput, RedditCommentsResponse } from '../types'
import { timeout } from '@crowd/common'

/**
 * Get the comment tree of a post.
 * @param input The input to get comments. It needs a Nango ID, the subreddit where the post was posted, and the post's ID
 * @param logger A logger instance for structured logging
 * @returns The Reddit API response of getting comments from a post
 */
async function getComments(
  input: RedditGetCommentsInput,
  ctx: IProcessStreamContext,
): Promise<RedditCommentsResponse> {
  try {
    ctx.log.info({ message: 'Fetching comments from a post in a sub-reddit', input })

    // Wait for 1.5s for rate limits.
    // eslint-disable-next-line no-promise-executor-return
    await timeout(1500)

    const globalCache = ctx.globalCache

    // Gett an access token from Nango
    const accessToken = await getNangoToken(input.nangoId, PlatformType.REDDIT, ctx)

    const config: AxiosRequestConfig = {
      method: 'get',
      url: `http://oauth.reddit.com/r/${input.subreddit}/comments/${input.postId}.json`,
      params: {
        limit: 100,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }

    const response: RedditCommentsResponse = (await axios(config)).data
    return response
  } catch (err) {
    ctx.log.error({ err, input }, 'Error while getting posts in subreddit')
    throw err
  }
}

export default getComments
