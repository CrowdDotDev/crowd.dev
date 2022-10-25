import { SuperfaceClient } from '@superfaceai/one-sdk'
import { SocialResponse } from '../../types/superfaceTypes'
import isInvalid from '../isInvalid'
import { PlatformType } from '../../../../types/integrationEnums'
import { IntegrationServiceBase } from '../../services/integrationServiceBase'

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
    console.log('Invalid request in profiles')
    console.log('Inputs: ', inputs)
    console.log('Result: ', result)
  }
  return {
    records: result.value.profiles,
    nextPage: result.value.nextPage,
    limit: result.value.rateLimit.remainingRequests,
    timeUntilReset: IntegrationServiceBase.secondsUntilTimestamp(
      result.value.rateLimit.resetTimestamp,
    ),
  }
}

export default getProfiles
