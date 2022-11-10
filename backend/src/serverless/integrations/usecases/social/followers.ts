import { SuperfaceClient } from '@superfaceai/one-sdk'
import { SocialResponse } from '../../types/superfaceTypes'
import isInvalid from '../isInvalid'
import { PlatformType } from '../../../../types/integrationEnums'
import { IntegrationServiceBase } from '../../services/integrationServiceBase'
import { createServiceChildLogger } from '../../../../utils/logging'
import { cleanSuperfaceError } from '../cleanError'

const log = createServiceChildLogger('getFollowers')

/**
 * Get all followers of an account
 * @param accessToken User token to access the Twitter API
 * @param profileId Profile to get followers for
 * @param page For API pagination
 * @returns Sueprface result with the posts and rate limiting information
 */
const getFollowers = async (
  client: SuperfaceClient,
  accessToken: string,
  profileId: string,
  page: string | undefined = '',
): Promise<SocialResponse> => {
  try {
    const provider = await client.getProvider(PlatformType.TWITTER)
    const profile = await client.getProfile('social-media/followers')

    page = page || undefined
    const inputs = { profileId, page }
    const result: any = await profile.getUseCase('GetFollowers').perform(inputs, {
      provider,
      parameters: {
        accessToken,
      },
    })
    if (isInvalid(result, 'followers')) {
      log.warn({ inputs, result }, 'Invalid request in followers')
    }
    return {
      records: result.value.followers,
      nextPage: result.value.nextPage,
      limit: result.value.rateLimit.remainingRequests,
      timeUntilReset: IntegrationServiceBase.secondsUntilTimestamp(
        result.value.rateLimit.resetTimestamp,
      ),
    }
  } catch (err) {
    throw cleanSuperfaceError(err)
  }
}

export default getFollowers
