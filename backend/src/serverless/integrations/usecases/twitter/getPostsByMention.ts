import axios from 'axios'
import moment from 'moment'
import {
  TwitterGetPostsByMentionInput,
  TwitterGetPostsOutput,
  TwitterParsedPosts,
} from '../../types/twitterTypes'
import { Logger } from '../../../../utils/logging'

/**
 * Get paginated posts by mention
 * @param input Input parameters
 * @returns Posts
 */
const getPostsByMention = async (
  input: TwitterGetPostsByMentionInput,
  logger: Logger,
): Promise<TwitterGetPostsOutput> => {
  try {
    let url = `https://api.twitter.com/2/users/${input.profileId}/mentions?max_results=${input.perPage}&tweet.fields=id,text,created_at,attachments,referenced_tweets,entities&expansions=attachments.media_keys,author_id&media.fields=duration_ms,height,media_key,preview_image_url,type,url,width,alt_text&user.fields=name,description,location,public_metrics,url,verified,profile_image_url`
    if (input.page !== undefined && input.page !== '') {
      url += `&next_token=${input.page}`
    }
    const config = {
      method: 'get',
      url,
      headers: {
        Authorization: `Bearer ${input.token}`,
      },
    }
    const response = await axios(config)

    const posts = response.data.data
    const media = response.data.includes.media
    const users = response.data.includes.users

    const postsOut: TwitterParsedPosts = []

    for (const post of posts) {
      if (post.attachments?.media_keys) {
        const computedMedia = post.attachments.media_keys.map((key) =>
          media.find((m) => m.media_key === key),
        )
        post.attachments = computedMedia
      }
      const member = users.find((u) => u.id === post.author_id)
      post.member = member
      postsOut.push(post)
    }

    const limit = parseInt(response.headers['x-rate-limit-remaining'], 10)
    const resetTs = parseInt(response.headers['x-rate-limit-reset'], 10) * 1000
    const timeUntilReset = moment(resetTs).diff(moment(), 'seconds')
    return {
      records: postsOut,
      nextPage: response.data.meta.next_token || '',
      limit,
      timeUntilReset,
    }
  } catch (err) {
    logger.error({ err, input }, 'Error while getting messages from Twitter')
    throw err
  }
}

export default getPostsByMention
