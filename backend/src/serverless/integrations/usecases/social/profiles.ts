import { SuperfaceClient } from '@superfaceai/one-sdk'
import { SocialResponse } from '../../types/superfaceTypes'
import isInvalid from '../isInvalid'
import { PlatformType } from '../../../../types/integrationEnums'
import { IntegrationServiceBase } from '../../services/integrationServiceBase'
import { createServiceChildLogger } from '../../../../utils/logging'
import { cleanSuperfaceError } from '../cleanError'

const log = createServiceChildLogger('getProfiles')

/**
 * Get all profiles of an account
 * @param accessToken User token to access the Twitter API
 * @param profileId Profile to get profiles for
 * @param page For API pagination
 * @returns Sueprface result with the posts and rate limiting information
 */
const getProfiles = async (
  client: SuperfaceClient,
  accessToken: string,
  members: Array<string>,
): Promise<SocialResponse> => {
  try {
    const provider = await client.getProvider(PlatformType.TWITTER)
    const profile = await client.getProfile('social-media/profiles')

    const inputs = { usernames: members }
    const result: any = await profile.getUseCase('GetProfilesByUsername').perform(inputs, {
      provider,
      parameters: {
        accessToken,
      },
    })
    if (isInvalid(result, 'profiles')) {
      log.warn({ inputs, result }, 'Invalid request in profiles')
    }
    return {
      records: result.value.profiles,
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

export default getProfiles
