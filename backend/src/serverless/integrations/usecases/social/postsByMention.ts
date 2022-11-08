import { SuperfaceClient } from '@superfaceai/one-sdk'
import { SocialResponse } from '../../types/superfaceTypes'
import isInvalid from '../isInvalid'
import { PlatformType } from '../../../../types/integrationEnums'
import { createServiceChildLogger } from '../../../../utils/logging'

const { inspect } = require('util')

const log = createServiceChildLogger('getPostsByMention')

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
      log.warn({ inputs, result }, 'Invalid request in mention')
    }
    return {
      records: result.value.posts,
      nextPage: result.value.nextPage,
      limit: result.value.rateLimit.remainingRequests,
      timeUntilReset: result.value.rateLimit.resetTimestamp,
    }
  } catch (err) {
    log.error(
      err,
      { errPayload: inspect(err, false, Infinity, true) },
      'Error while fetching posts by mentions!',
    )
    throw err
  }
}

export default getPostsByMention
