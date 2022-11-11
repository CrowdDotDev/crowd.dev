import { SuperfaceClient } from '@superfaceai/one-sdk'
import { SocialResponse } from '../../types/superfaceTypes'
import isInvalid from '../isInvalid'
import { PlatformType } from '../../../../types/integrationEnums'
import { createServiceChildLogger } from '../../../../utils/logging'
import { cleanSuperfaceError } from '../cleanError'

const log = createServiceChildLogger('findPostsByHashtag')

/**
 * Perform a hashtag lookup with SuperFace
 * @param accessToken User token to access the Twitter API
 * @param hashtag Hashtag to search for
 * @param page For API pagination
 * @returns Sueprface result with the posts and rate limiting information
 */
const findPostsByHashtag = async (
  client: SuperfaceClient,
  accessToken: string,
  hashtag: string,
  page: string | undefined = '',
  afterDate: string | undefined = undefined,
): Promise<SocialResponse> => {
  try {
    const provider = await client.getProvider(PlatformType.TWITTER)
    const profile = await client.getProfile('social-media/posts-lookup')
    page = page || undefined
    const inputs = { hashtag, page, afterDate }
    const result: any = await profile.getUseCase('FindByHashtag').perform(inputs, {
      provider,
      parameters: {
        accessToken,
      },
    })
    if (isInvalid(result, 'posts')) {
      log.warn({ inputs, result }, 'Invalid request in hashtag')
    }
    return {
      records: result.value.posts,
      nextPage: result.value.nextPage,
      limit: result.value.rateLimit.remainingRequests,
      timeUntilReset: result.value.rateLimit.resetTimestamp,
    }
  } catch (err) {
    throw cleanSuperfaceError(err)
  }
}

export default findPostsByHashtag
