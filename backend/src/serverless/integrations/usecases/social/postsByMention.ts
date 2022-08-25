import { SuperfaceClient } from '@superfaceai/one-sdk'
import { SocialResponse } from '../../types/superfaceTypes'
import isInvalid from '../isInvalid'
import { PlatformType } from '../../../../utils/platforms'

/**
 * Find posts that mention a twitter profile
 * @param profileId ID of the profile to get the posts from
 * @param page For API pagination
 * @returns List of posts and rate limiting from SuperFace
 */
const getPostsByMention = async (
  client: SuperfaceClient,
  accessToken: string,
  profileId: string,
  page: string | undefined = '',
  afterDate: string | undefined = undefined,
): Promise<SocialResponse> => {
  const { inspect } = require('util')

  try {
    const provider = await client.getProvider(PlatformType.TWITTER)
    const profile = await client.getProfile('social-media/posts-lookup')

    page = page || undefined
    const inputs = { profileId, page, afterDate }
    const result: any = await profile.getUseCase('FindByMention').perform(inputs, {
      provider,
      parameters: {
        accessToken,
      },
    })
    if (isInvalid(result, 'posts')) {
      console.log('Invalid request in mention')
      console.log('Inputs: ', inputs)
      console.log('Result: ', result)
    }
    return {
      records: result.value.posts,
      nextPage: result.value.nextPage,
      limit: result.value.rateLimit.remainingRequests,
      timeUntilReset: result.value.rateLimit.resetTimestamp,
    }
  } catch (err) {
    console.error(inspect(err, false, Infinity, true))
    throw err
  }
}

export default getPostsByMention
